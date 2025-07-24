import { redirect } from 'next/navigation';

// 因為之前有個專案需要占用 aicoach.voiss.cc/charitable
// 但 aicoach 已經被此專案占用
// 所以目前直接從 aicoach.voiss.cc/charitable 轉址到 dev3.voiss.cc/charitable

export default function Page() {
  redirect('https://dev3.voiss.cc/charitable/');
  return null;
}