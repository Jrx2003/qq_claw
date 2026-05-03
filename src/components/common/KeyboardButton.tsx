import { Button } from "@/components/ui/button";

export function KeyboardButton({
  label,
  onClick,
  tone = "outline",
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  tone?: "default" | "outline" | "success" | "warn";
  disabled?: boolean;
}) {
  return (
    <Button
      className="min-h-9 flex-1 rounded-xl px-3 text-[13px]"
      disabled={disabled}
      onClick={onClick}
      type="button"
      variant={tone}
    >
      {label}
    </Button>
  );
}
