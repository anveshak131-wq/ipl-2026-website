// WPL Teams Data with colors, descriptions, and logo paths
import { Team } from '@/types';

export const wplTeams: Omit<Team, 'id' | 'players'>[] = [
  {
    league: 'wpl',
    name: 'Mumbai Indians (WPL)',
    shortName: 'MI-W',
    logo: '/logos/wpl_mi_logo_animated.svg',
    description: 'The powerhouse of women\'s cricket, Mumbai Indians WPL brings the same winning legacy and aggressive style to the Women\'s Premier League. With a perfect blend of experience and emerging talent, they represent the spirit of Mumbai - fearless, determined, and always aiming for excellence. The Sudarshana Chakra in their logo symbolizes power, protection, and the relentless pursuit of victory.',
    colors: {
      primary: '#004BA0', // Blue (Mumbai Indians)
      secondary: '#FFD700' // Gold
    },
    trophies: [],
    homeGrounds: ['Wankhede Stadium, Mumbai']
  },
  {
    league: 'wpl',
    name: 'Royal Challengers Bengaluru (WPL)',
    shortName: 'RCB-W',
    logo: '/logos/wpl_rcb_logo_animated.svg',
    description: 'Breaking barriers and setting new standards, Royal Challengers Bengaluru WPL embodies boldness and determination. The team represents the spirit of Bengaluru - innovative, dynamic, and unafraid to challenge conventions. With their iconic red and gold colors adapted for WPL, they bring the same passion and fire to women\'s cricket, inspiring a new generation of female cricketers.',
    colors: {
      primary: '#C8102E', // Red (RCB)
      secondary: '#FFD700' // Gold
    },
    trophies: [],
    homeGrounds: ['M. Chinnaswamy Stadium, Bengaluru']
  },
  {
    league: 'wpl',
    name: 'Delhi Capitals (WPL)',
    shortName: 'DC-W',
    logo: '/logos/wpl_dc_logo_animated.svg',
    description: 'Representing the strength and heritage of the capital, Delhi Capitals WPL combines the power of three roaring tigers with the dignity of the Parliament. This team embodies the spirit of Delhi - resilient, powerful, and always ready to lead. With a perfect mix of international stars and domestic talent, they showcase the best of women\'s cricket with grace and determination.',
    colors: {
      primary: '#004BA0', // Blue (Delhi Capitals)
      secondary: '#DC2626' // Red (Tigers)
    },
    trophies: [],
    homeGrounds: ['Arun Jaitley Stadium, Delhi']
  },
  {
    league: 'wpl',
    name: 'Gujarat Giants (WPL)',
    shortName: 'GG',
    logo: '/logos/wpl_gg_logo_animated.svg',
    description: 'The pride of Gujarat, Gujarat Giants WPL features the majestic Asiatic lioness - symbolizing courage, strength, and the indomitable spirit of the state. This team represents the essence of Gujarat - bold, fearless, and always ready to roar. With a focus on nurturing local talent and combining it with international experience, they bring the warrior spirit to every match.',
    colors: {
      primary: '#F97316', // Orange (Gujarat Giants)
      secondary: '#FFD700' // Gold
    },
    trophies: [],
    homeGrounds: ['Narendra Modi Stadium, Ahmedabad']
  },
  {
    league: 'wpl',
    name: 'UP Warriorz (WPL)',
    shortName: 'UPW',
    logo: '/logos/wpl_upw_logo_animated.svg',
    description: 'The warriors from Uttar Pradesh, UP Warriorz WPL combines the grace of the Sarus crane with the valor of a warrior. The logo features a shield, sword, and wings - representing protection, strength, and the freedom to soar. This team embodies the spirit of Uttar Pradesh - resilient, determined, and always fighting for glory. They bring together the best talent from the heartland of India.',
    colors: {
      primary: '#059669', // Green (UP Warriorz)
      secondary: '#F97316' // Orange
    },
    trophies: [],
    homeGrounds: ['Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow']
  }
];

