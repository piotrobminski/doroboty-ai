import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("ui-button", {
  variants: {
    variant: {
      default: "ui-button-dark",
      outline: "ui-button-outline",
      secondary: "ui-button-secondary",
      ghost: "ui-button-ghost",
      destructive: "ui-button-destructive",
      link: "ui-button-link",
      lime: "ui-button-lime",
    },
    size: {
      default: "ui-button-default",
      xs: "ui-button-xs",
      sm: "ui-button-sm",
      lg: "ui-button-lg",
      icon: "ui-button-icon",
      "icon-xs": "ui-button-icon",
      "icon-sm": "ui-button-icon",
      "icon-lg": "ui-button-icon",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
