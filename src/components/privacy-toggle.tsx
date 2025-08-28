"use client";

import * as React from "react";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~/components/ui/dropdown-menu";
import { usePrivacy } from "./privacy";

export function PrivacyToggle() {
  const { mode, setMode } = usePrivacy();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {mode === "off" ? (
          <EyeIcon className="size-[1.2rem]" />
        ) : (
          <EyeClosedIcon className="size-[1.2rem]" />
        )}
        Discreet mode
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => setMode("off")}>Off</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("blur")}>
          Blur
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("hoverToReveal")}>
          Hover to reveal
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
