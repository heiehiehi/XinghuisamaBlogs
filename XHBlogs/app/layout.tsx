import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import BackgroundEffects from "../components/BackgroundEffects";
import { MusicProvider } from "../components/MusicProvider";
import FloatingPlayer from "../components/FloatingPlayer";
import { siteConfig } from "../siteConfig";
import ClickEffect from "../components/ClickEffect";
import BackgroundSlider from "../components/BackgroundSlider";
import GlobalToolbox from "../components/GlobalToolbox";
import SplashScreen from "../components/SplashScreen";
import CyberCat from '../components/CyberCat';
import DanmakuBackground from '../components/DanmakuBackground';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-serif",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "XingHuiSama の 博客",
  description: "在代码、学术与提瓦特大陆间穿梭的旅人",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* 【核心修复】：改成用 html 的类名来控制显示，绝对不删节点 */}
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              /* 默认状态：主内容隐藏 */
              #app-mount-root { opacity: 0; visibility: hidden; pointer-events: none; }
              
              /* 如果 html 上有 splash-seen 类名，立刻显示主内容 */
              html.splash-seen #app-mount-root { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
            `
          }}
        />

        {/* 原生脚本只负责加类名，React 看到 html 上的 suppressHydrationWarning 就不会报错 */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('hasSeenSplash') === 'true') {
                  document.documentElement.classList.add('splash-seen');
                }
              } catch (e) {}
            `
          }}
        />
      </head>

      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>

          <SplashScreen />

          <MusicProvider>
            <div id="app-mount-root" className="flex-1 flex flex-col transition-opacity duration-1000">
              <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                {!siteConfig.useGradient && <BackgroundSlider />}
                <div className="absolute inset-0 z-[-9] bg-white/30 dark:bg-slate-900/40 backdrop-blur-md transition-colors duration-1000"></div>

                <div
                  className="absolute inset-0 z-[-8] opacity-60 dark:opacity-20 mix-blend-color transition-opacity duration-1000 transform-gpu"
                  style={{
                    background: `linear-gradient(-45deg, ${siteConfig.themeColors.join(', ')})`,
                    backgroundSize: '400% 400%',
                    animation: 'gradientMove 15s ease infinite'
                  }}
                ></div>

                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/40 dark:bg-indigo-900/20 blur-[100px] rounded-full mix-blend-overlay z-[-7]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/30 dark:bg-purple-900/30 blur-[100px] rounded-full mix-blend-overlay z-[-7]"></div>
                <BackgroundEffects />
              </div>
                <DanmakuBackground />

              <div className="relative z-10 flex-1 flex flex-col">
                {children}
              </div>

              <FloatingPlayer />
              <GlobalToolbox />
              <ClickEffect />
            </div>

            <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
              @keyframes gradientMove { 
                0% { background-position: 0% 50%; } 
                50% { background-position: 100% 50%; } 
                100% { background-position: 0% 50%; } 
              }
            `}} />
          </MusicProvider>
            <CyberCat /> {/* 👈 狸花管家降临！ */}
        </ThemeProvider>
      </body>
    </html>
  );
}