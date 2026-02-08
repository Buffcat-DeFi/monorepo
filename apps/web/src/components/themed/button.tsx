import { Button, buttonVariants } from "../ui/button";
import { motion } from "motion/react";
import { VariantProps } from "class-variance-authority";

type Style = "primary" | "secondary";

interface ThemedButtonProps {
  style: Style;
}

const styles: {
  [key in Style]: string;
} = {
  primary: `bg-custom-primary-color text-custom-tertiary-text
  hover:bg-custom-primary-color hover:text-custom-tertiary-text
  border-none hover:border-none`,
  secondary: `bg-custom-card-alt hover:bg-custom-card-alt hover:text-custom-primary-text`,
};

export default function ThemedButton({
  style,
  variant,
  size,
  className,
  children,
  ...props
}: ThemedButtonProps &
  VariantProps<typeof buttonVariants> &
  React.ComponentProps<"button">) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant={variant}
        size={size}
        className={`${className} cursor-pointer ${style == "primary" ? styles.primary : styles.secondary}`}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}
