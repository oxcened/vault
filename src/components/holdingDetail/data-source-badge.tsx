import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function DataSourceBadge({
  isCarried = false,
  label,
}: {
  isCarried?: boolean | null;
  label: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={isCarried ? "secondary" : "default"}>{label}</Badge>
        </TooltipTrigger>
        <TooltipContent>{isCarried ? "Unchanged" : "Changed"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
