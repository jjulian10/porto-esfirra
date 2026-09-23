export type PaymentSnapshot={status?:string;total_paid_amount?:string};
export function paymentState(result:PaymentSnapshot,totalCents:number){
  const numeric=Number(result.total_paid_amount??'0');
  const paidAmount=Number.isFinite(numeric)?Math.max(0,Math.round(numeric*100)):0;
  const paymentStatus=result.status==='processed'&&paidAmount>=totalCents?'paid':paidAmount>0?'partial':result.status==='cancelled'?'failed':'pending';
  return {paidAmount,paymentStatus};
}
