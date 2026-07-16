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
  primary: `bg-custom-primary-color text-custom-secondary-text
  hover:bg-custom-primary-color hover:text-custom-secondary-text
  border-none hover:border-none`,
  secondary: `bg-custom-bg-alt hover:bg-custom-bg-alt text-custom-secondary-text hover:text-custom-secondary-text`,
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
