import { SVGProps, forwardRef } from "react";

export const SteeringWheel = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        {...props}
      >
        <path
          d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 2a8 8 0 0 1 7.38 4.92A30 30 0 0 0 12 8a29.6 29.6 0 0 0-7.4.94A8 8 0 0 1 12 4m-8 8.67 1.11-.13A4.38 4.38 0 0 1 10 16.89v2.85a8 8 0 0 1-6-7.07m10 7.07v-2.85a4.38 4.38 0 0 1 4.86-4.35l1.11.13A8 8 0 0 1 14 19.74"
          fill="currentColor"
        />
      </svg>
    );
  }
);

SteeringWheel.displayName = "SteeringWheel";
