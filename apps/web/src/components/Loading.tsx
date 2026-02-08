import React, { useState, useEffect } from "react";

interface LoadingProps {
  type?: "spinner" | "dots";
  size?: "sm" | "md" | "lg" | "xl" | "dxl";
  color?: "blue" | "gray" | "green" | "red" | "yellow";
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  type = "spinner",
  size = "md",
  color = "blue",
  text,
}) => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (type === "dots") {
      const interval = setInterval(() => {
        setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
      }, 500);

      return () => clearInterval(interval);
    }
  }, [type]);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    dxl: "w-20 h-20",
  };

  const colorClasses = {
    blue: "border-blue-500",
    gray: "border-gray-500",
    green: "border-green-500",
    red: "border-red-500",
    yellow: "border-yellow-500",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    dxl: "text-2xl",
  };

  const dotSizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
    xl: "w-5 h-5",
    dxl: "w-6 h-6",
  };

  const dotColorClasses = {
    blue: "bg-blue-500",
    gray: "bg-gray-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
  };

  if (type === "spinner") {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <div
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color]} 
            border-4 border-t-transparent 
            rounded-full 
            animate-spin
          `}
        />
        {text && (
          <p className={`text-gray-600 ${textSizeClasses[size]}`}>{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="flex items-center space-x-1">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className={`
              ${dotSizeClasses[size]}
              rounded-full
              transition-all duration-300
              ${num <= dotCount ? `${dotColorClasses[color]} opacity-100 scale-100` : "bg-gray-300 opacity-40 scale-75"}
            `}
          />
        ))}
      </div>
      {text && (
        <p className={`text-gray-600 ${textSizeClasses[size]}`}>{text}</p>
      )}
    </div>
  );
};
