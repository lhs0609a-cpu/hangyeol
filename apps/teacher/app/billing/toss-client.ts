interface Widgets {
  setAmount(value: { currency: 'KRW'; value: number }): Promise<void>;
  renderPaymentMethods(value: { selector: string; variantKey?: string }): Promise<{ destroy(): Promise<void> }>;
  renderAgreement(value: { selector: string }): Promise<{ destroy(): Promise<void> }>;
  requestPayment(value: { orderId: string; orderName: string; successUrl: string; failUrl: string }): Promise<void>;
}
interface Toss {
  widgets(value: { customerKey: string }): Widgets;
  payment(value: { customerKey: string }): {
    requestBillingAuth(value: { method: 'CARD'; successUrl: string; failUrl: string }): Promise<void>;
    requestPayment(value: { method: 'CARD'; amount: { currency: 'KRW'; value: number }; orderId: string; orderName: string; successUrl: string; failUrl: string }): Promise<void>;
  };
}
declare global { interface Window { TossPayments?: (clientKey: string) => Toss } }
let loading: Promise<void> | undefined;
export function usesPaymentWidget(clientKey: string) { return /^(test|live)_gck_/.test(clientKey); }
export async function requestCardPayment(clientKey: string, order: { id: string; name: string; amount: number }, successUrl: string, failUrl: string) {
  const toss = await loadToss(clientKey);
  return toss.payment({customerKey:crypto.randomUUID()}).requestPayment({method:'CARD',amount:{currency:'KRW',value:order.amount},orderId:order.id,orderName:order.name,successUrl,failUrl});
}
export async function loadToss(clientKey: string) {
  if (!window.TossPayments) {
    loading ??= new Promise<void>((resolve,reject) => {
      const script = document.createElement('script'); script.src = 'https://js.tosspayments.com/v2/standard';
      script.onload = () => resolve(); script.onerror = () => { loading = undefined; script.remove(); reject(new Error('결제 화면을 불러오지 못했습니다')); };
      document.head.append(script);
    });
    await loading;
  }
  if (!window.TossPayments) throw new Error('결제 화면을 불러오지 못했습니다');
  return window.TossPayments(clientKey);
}
