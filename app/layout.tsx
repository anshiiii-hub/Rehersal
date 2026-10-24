import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Rehearsal — Make every conversation count',description:'Build, rehearse, and launch voice AI agents.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
