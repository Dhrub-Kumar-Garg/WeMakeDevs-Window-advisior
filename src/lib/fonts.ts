import { Space_Grotesk, Space_Mono, Instrument_Serif } from 'next/font/google';

export const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', weight: ['400','500','700'] });
export const spaceMono = Space_Mono({ subsets: ['latin'], variable: '--font-mono-ui', weight: ['400','700'] });
export const instrumentSerif = Instrument_Serif({ subsets: ['latin'], variable: '--font-serif-ui', weight: '400', style: ['normal','italic'] });
