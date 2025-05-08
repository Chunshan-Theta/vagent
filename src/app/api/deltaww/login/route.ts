import { NextResponse } from 'next/server';


/**
 * 相關的 env 變數
 * DELTAWW_ACCOUNT_LIST_FILE : 指定用戶名單的檔案路徑，格式 => [{account: "帳號", password: "密碼"}, {account: "帳號", password: "密碼"}]
 * 
 */


type DemoAccount = {
  account: string;
  password: string;
}

type LoginCheckProps = {
  account: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const accList: DemoAccount[] = [];
    if(process.env.NODE_ENV === 'development'){
      accList.push({ account: 'test', password: 'test' });
    }
    accList.push(...(await loadAccountList()))
    const body: LoginCheckProps = await request.json();
    const { account, password } = body;

    const acc = accList.find((item) => item.account === account )
    if(!acc){
      return NextResponse.json({ error:true, message: '帳號或密碼錯誤' }, { status: 401 });
    }
    if(acc.password !== password){
      return NextResponse.json({ error:true, message: '帳號或密碼錯誤' }, { status: 401 });
    }
    return NextResponse.json({ message: '登入成功' }, { status: 200 });
  } catch (error) {
    console.error('Deltaww login failed:', error);
    return NextResponse.json(
      { error: '登入失敗，請稍後再試' },
      { status: 500 }
    );
  }
}


async function loadAccountList() : Promise<DemoAccount[]> {
  const fs = await import('fs')
  const filePath = process.env.DELTAWW_ACCOUNT_LIST_FILE;
  if (!filePath) {
    return [];
  }

  try {
    const data = await readFile(filePath);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading account list file');
    throw error;
  }


  function readFile(filePath: string) {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.toString());
        }
      });
    });
  }
}