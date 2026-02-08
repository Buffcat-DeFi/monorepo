import React, { useState, createContext, useContext, useRef } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { typography } from "@/styles/typography";

// Context for dialog state management
type ConsentDialogState = {
  isOpen?: boolean;
  title: string;
  description: string;
  onConfirm: (confirmed?: boolean) => void;
  onCancel: (confirmed?: boolean) => void;
};

type LoadingDialogState = {
  isOpen: boolean;
  title: string;
  description: string;
};

type DialogContextType = {
  consentState: ConsentDialogState;
  loadingState: LoadingDialogState;
  showConsentDialog: (config: ConsentDialogState) => void;
  hideConsentDialog: () => void;
  showLoadingDialog: (config: LoadingDialogState) => void;
  hideLoadingDialog: () => void;
};

const DialogContext = createContext<DialogContextType>({
  consentState: {
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  },
  loadingState: {
    isOpen: false,
    title: "Processing...",
    description: "Please wait while we process your request.",
  },
  showConsentDialog: () => {},
  hideConsentDialog: () => {},
  showLoadingDialog: () => {},
  hideLoadingDialog: () => {},
});

// Dialog Provider Component
export const DialogProvider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [consentState, setConsentState] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [loadingState, setLoadingState] = useState({
    isOpen: false,
    title: "Processing...",
    description: "Please wait while we process your request.",
  });

  const showConsentDialog = (config: ConsentDialogState) => {
    setConsentState({
      ...config,
      isOpen: true,
    });
  };

  const hideConsentDialog = () => {
    setConsentState((prev) => ({ ...prev, isOpen: false }));
  };

  const showLoadingDialog = (config: LoadingDialogState) => {
    setLoadingState({
      ...config,
      isOpen: true,
    });
  };

  const hideLoadingDialog = () => {
    setLoadingState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <DialogContext.Provider
      value={{
        consentState,
        loadingState,
        showConsentDialog,
        hideConsentDialog,
        showLoadingDialog,
        hideLoadingDialog,
      }}
    >
      {children}
      <ConsentDialog />
      <LoadingDialog />
    </DialogContext.Provider>
  );
};

// Hook to use dialog context
export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};

// Consent Dialog Component using shadcn/ui AlertDialog
const ConsentDialog = () => {
  const { consentState, hideConsentDialog } = useDialog();

  const isConfirmingRef = useRef(false);

  const handleConfirm = () => {
    try {
      isConfirmingRef.current = true;
      consentState.onConfirm?.(true);
    } catch (e) {
      console.error("consent onConfirm error", e);
    } finally {
      hideConsentDialog();
      setTimeout(() => {
        isConfirmingRef.current = false;
      }, 0);
    }
  };

  const handleCancel = () => {
    try {
      consentState.onCancel?.(false);
    } catch (e) {
      console.error("consent onCancel error", e);
    }
    hideConsentDialog();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isConfirmingRef.current) {
      handleCancel();
    }
  };

  return (
    <AlertDialog open={consentState.isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className="bg-custom-secondary-color text-custom-primary-text
      neo-shadow-sm border-2 border-custom-primary-color"
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="">
              <AlertTriangle className="w-8 h-8 text-custom-primary-color" />
            </div>
            <AlertDialogTitle className={typography.h4}>
              {consentState.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {consentState.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleCancel}
            className="text-custom-primary-color cursor-pointer"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="cursor-pointer bg-custom-primary-color text-custom-tertiary-text
            border border-custom-primary-color hover:bg-custom-secondary-color
            hover:text-custom-primary-text"
          >
            Proceed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Loading Dialog Component using shadcn/ui Card
const LoadingDialog = () => {
  const { loadingState } = useDialog();

  if (!loadingState.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
    backdrop-blur-sm bg-custom-primary-color/30"
    >
      {/* Dialog using Card */}
      <Card
        className="bg-custom-secondary-color text-custom-primary-text
      relative w-80 mx-4 animate-in fade-in-0 zoom-in-95 duration-300
      neo-shadow-sm border-2 border-custom-primary-color"
      >
        <CardHeader className="text-center pb-4">
          {/* Animated Loading Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-custom-primary-text" />
            </div>
          </div>
          <CardTitle className="text-xl">{loadingState.title}</CardTitle>
          <CardDescription>{loadingState.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Progress dots animation */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 text-custom-primary-text rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
