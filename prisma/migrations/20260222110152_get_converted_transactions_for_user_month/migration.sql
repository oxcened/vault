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
    AND t."timestamp" < date_trunc('month', input_month) + INTERVAL '1 month'
    AND t."status" = 'POSTED';
END;
$$ LANGUAGE plpgsql;