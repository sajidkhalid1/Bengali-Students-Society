// Provider messages and request bodies can contain credentials or member data.
// Record only transport status and a Stripe request reference.
export function reportServiceFailure(service: "storage" | "stripe" | "gmail", status?: number, requestId?: string | null) {
  console.error("BSS_SERVICE_REQUEST_FAILED", {
    service,
    status: status ?? "network-error",
    ...(service === "stripe" && /^req_[A-Za-z0-9]{1,64}$/.test(requestId || "") ? { requestId } : {}),
  });
}
