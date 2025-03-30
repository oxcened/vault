-- Drop deprecated function if it exists
DROP FUNCTION IF EXISTS update_cash_flow_from_date(DATE, VARCHAR, VARCHAR);

-- Create a helper function to recompute cash flow from a given date for a user
CREATE OR REPLACE FUNCTION recompute_cash_flow_for_user_from(
  input_user_id TEXT,
  input_start_date DATE,
  input_target_currency TEXT
)
RETURNS VOID AS $$
DECLARE
  current_month DATE := date_trunc('month', input_start_date);
  today_month DATE := date_trunc('month', CURRENT_DATE);
BEGIN
  WHILE current_month <= today_month LOOP
    PERFORM update_cash_flow_for_user_month(input_user_id, current_month, input_target_currency);
    current_month := current_month + INTERVAL '1 month';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to recompute monthly cash flow for a user
CREATE OR REPLACE FUNCTION update_cash_flow_for_user_month(
  input_user_id TEXT,
  input_month TIMESTAMP,
  input_target_currency TEXT
)
RETURNS VOID AS $$
DECLARE
  month_start DATE := date_trunc('month', input_month);
  month_end DATE := (date_trunc('month', input_month) + INTERVAL '1 month - 1 day')::DATE;
  total_income NUMERIC := 0;
  total_expense NUMERIC := 0;
BEGIN
  -- Sum converted transaction values
  SELECT
    COALESCE(SUM(CASE WHEN ct.type = 'INCOME' THEN ct.converted_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN ct.type = 'EXPENSE' THEN ct.converted_amount ELSE 0 END), 0)
  INTO total_income, total_expense
  FROM get_converted_transactions_for_user_month(input_user_id, input_month, input_target_currency) ct;

  -- Upsert into CashFlow table
  INSERT INTO "CashFlow" (
    "id",
    "createdById",
    "timestamp",
    "income",
    "expenses",
    "netFlow",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    gen_random_uuid(),
    input_user_id,
    month_start,
    total_income,
    total_expense,
    total_income - total_expense,
    now(),
    now()
  )
  ON CONFLICT ("createdById", "timestamp") DO UPDATE
  SET
    "income" = EXCLUDED."income",
    "expenses" = EXCLUDED."expenses",
    "netFlow" = EXCLUDED."netFlow",
    "updatedAt" = EXCLUDED."updatedAt";

  -- Delete existing dependencies
  DELETE FROM "DerivedDataDependency"
  WHERE "targetType" = 'CashFlow'
    AND "targetKey" = input_user_id || ':' || to_char(month_start, 'YYYY-MM-DD"T00:00:00Z"');

  -- Insert new exchange rate dependencies
  INSERT INTO "DerivedDataDependency" ("id", "targetType", "targetKey", "dependencyType", "dependencyKey", "createdAt", "updatedAt")
  SELECT DISTINCT
    gen_random_uuid(),  
    'CashFlow',
    input_user_id || ':' || to_char(month_start, 'YYYY-MM-DD"T00:00:00Z"'),
    'ExchangeRate',
    ct.exchange_rate_id,
    now(),
    now()
  FROM get_converted_transactions_for_user_month(input_user_id, input_month, input_target_currency) ct
  WHERE ct.exchange_rate_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Return all transactions for a user in a given month, converted to target currency
CREATE OR REPLACE FUNCTION get_converted_transactions_for_user_month(
  input_user_id TEXT,
  input_month TIMESTAMP,
  input_target_currency TEXT
)
RETURNS TABLE (
  id TEXT,
  "timestamp" TIMESTAMP,
  original_amount NUMERIC,
  converted_amount NUMERIC,
  currency TEXT,
  category_id TEXT,
  type TEXT,
  exchange_rate_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t."timestamp",
    t.amount,
    gcd.converted_amount,
    t.currency,
    t."categoryId",
    t."type"::TEXT,
    gcd.exchange_rate_id
  FROM "Transaction" t,
  LATERAL get_transaction_conversion_details(t.amount, t.currency, t."timestamp", input_target_currency) AS gcd
  WHERE t."createdById" = input_user_id
    AND t."timestamp" >= date_trunc('month', input_month)
    AND t."timestamp" < date_trunc('month', input_month) + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- Function to return converted amount and the exchange rate ID used
CREATE OR REPLACE FUNCTION get_transaction_conversion_details(
  input_amount NUMERIC,
  input_currency TEXT,
  input_timestamp TIMESTAMP,
  input_target_currency TEXT
)
RETURNS TABLE (
  converted_amount NUMERIC,
  exchange_rate_id TEXT
) AS $$
DECLARE
  rate_record RECORD;
BEGIN
  -- No conversion needed if currencies match
  IF input_currency = input_target_currency THEN
    RETURN QUERY SELECT input_amount, NULL;
    RETURN;
  END IF;

  -- Try to fetch the most recent exchange rate
  SELECT er.rate, er.id INTO rate_record
  FROM "ExchangeRate" er
  WHERE er."baseCurrency" = input_currency
    AND er."quoteCurrency" = input_target_currency
    AND er."timestamp" <= input_timestamp
  ORDER BY er."timestamp" DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT input_amount * rate_record.rate, rate_record.id;
  ELSE
    -- Fallback: assume rate = 1, unknown source
    RETURN QUERY SELECT input_amount, NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to recompute derived data for a dependency
CREATE OR REPLACE FUNCTION recompute_derived_data_for_dependency(
  input_dependency_type TEXT,
  input_dependency_key TEXT,
  input_target_currency TEXT
)
RETURNS VOID AS $$
DECLARE
  record_row RECORD;
  target_type TEXT;
  target_key TEXT;
  user_id TEXT;
  snapshot_ts TIMESTAMP;
BEGIN
  FOR record_row IN
    SELECT "targetType", "targetKey"
    FROM "DerivedDataDependency"
    WHERE "dependencyType" = input_dependency_type
      AND "dependencyKey" = input_dependency_key
  LOOP
    target_type := record_row."targetType";
    target_key := record_row."targetKey";

    -- Dispatch to the appropriate recompute logic
    IF target_type = 'NetWorth' THEN
      user_id := split_part(target_key, ':', 1);
      snapshot_ts := to_timestamp(split_part(target_key, ':', 2), 'YYYY-MM-DD"T"HH24:MI:SS');
      PERFORM update_net_worth_for_user_month(user_id, snapshot_ts, input_target_currency);
    ELSIF target_type = 'CashFlow' THEN
      user_id := split_part(target_key, ':', 1);
      snapshot_ts := to_timestamp(split_part(target_key, ':', 2), 'YYYY-MM-DD"T"HH24:MI:SS');
      PERFORM update_cash_flow_for_user_month(user_id, snapshot_ts, input_target_currency);
    ELSE
      -- Future targetType handlers can be added here
      RAISE NOTICE 'No recompute handler for target type %', target_type;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;