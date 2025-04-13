import {
  createContext,
  useContext,
  useState,
  HTMLAttributes,
  ReactNode,
  Children,
  isValidElement,
} from "react";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

const EditableContext = createContext<{
  value: string;
  setValue: (val: string) => void;
  isEditing: boolean;
  startEditing: () => void;
  stopEditing: () => void;
} | null>(null);

export const useEditable = () => {
  const ctx = useContext(EditableContext);
  if (!ctx) throw new Error("Must be used within EditableValue");
  return ctx;
};

export function EditableValue({
  initialValue,
  onCommit,
  children,
}: {
  initialValue: string;
  onCommit: (val: string) => void;
  children: ReactNode;
}) {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const stopEditing = () => {
    setIsEditing(false);
    if (value !== initialValue) onCommit(value);
  };

  const context = {
    value,
    setValue,
    isEditing,
    startEditing: () => setIsEditing(true),
    stopEditing,
  };

  const childArray = Children.toArray(children);

  const input = childArray.find(
    (child) => isValidElement(child) && child.type === EditableValueInput,
  );

  const display = childArray.find(
    (child) => isValidElement(child) && child.type === EditableValueDisplay,
  );

  return (
    <EditableContext.Provider value={context}>
      {isEditing ? input : display}
    </EditableContext.Provider>
  );
}

export function EditableValueInput(props: HTMLAttributes<HTMLInputElement>) {
  const { value, setValue, stopEditing } = useEditable();
  return (
    <Input
      {...props}
      className={cn(
        "h-auto w-fit border-none p-0 text-sm shadow-none focus-visible:ring-0",
        props.className,
      )}
      value={value}
      autoFocus
      onChange={(e) => setValue(e.currentTarget.value)}
      onBlur={stopEditing}
    />
  );
}
EditableValueInput.displayName = "EditableValueInput";

export function EditableValueDisplay({
  render,
  className,
}: {
  render?: (value: string) => ReactNode;
  className?: string;
}) {
  const { value, startEditing } = useEditable();

  return (
    <div onClick={startEditing} className={cn("cursor-pointer", className)}>
      {render ? render(value) : value}
    </div>
  );
}
EditableValueDisplay.displayName = "EditableValueDisplay";
