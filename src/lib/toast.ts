export type ToastType = "success" | "error" | "info";

export function showToast(message: string, type: ToastType = "success") {
 if (typeof window === "undefined") return;
 window.dispatchEvent(new CustomEvent("zed:toast", { detail: { message, type } }));
}