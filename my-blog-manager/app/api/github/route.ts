import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. 读取 Gitalk 发过来的数据
    const body = await req.text();

    // 2. 由我们自己的服务器在后台偷偷发给 GitHub，完美绕过浏览器的跨域拦截！
    const githubRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
        'Accept': 'application/json',
      },
      body: body,
    });

    // 3. 把 GitHub 的成功响应原封不动地还给前端 Gitalk
    const data = await githubRes.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('代理请求失败:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}