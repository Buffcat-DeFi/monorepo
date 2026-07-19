import { useDialog } from "@/components/Dialog";
import { toast } from "sonner";

export const useTransactionDialog = () => {
  const { showConsentDialog, showLoadingDialog, hideLoadingDialog } =
    useDialog();

  const withConfirmation = async <T>(
    action: () => Promise<T>,
    config: {
      title: string;
      description: string;
      successMessage: string;
      loadingTitle: string;
      loadingDescription: string;
    },
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      showConsentDialog({
        title: config.title,
        description: config.description,
        onConfirm: async (confirmed) => {
          if (!confirmed) {
            reject(new Error("User cancelled"));
            return;
          }

          try {
            showLoadingDialog({
              isOpen: true,
              title: config.loadingTitle,
              description: config.loadingDescription,
            });

            const result = await action();

            toast.success("Success", {
              description: config.successMessage,
            });

            resolve(result);
          } catch (error: any) {
            toast.error("Transaction Failed", {
              description: error.message || "An error occurred",
            });
            reject(error);
          } finally {
            hideLoadingDialog();
          }
        },
        onCancel: () => {
          toast.error("Cancelled", {
            description: "Transaction was cancelled",
          });
        },
      });
    });
  };

  return { withConfirmation };
};
