import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Porto Esfirras | Esfirras feitas na hora em Porto Velho', description: 'Conheça a Porto Esfirras em Porto Velho. Esfirras salgadas e doces, pizzas e bebidas.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({children}:{children:React.ReactNode}){ return <html lang="pt-BR"><body>{children}</body></html>; }
