'use client';

import { motion } from 'framer-motion';
import { Twitter, Facebook, Instagram, Youtube, Globe, ExternalLink } from 'lucide-react';

interface SocialMediaLinksProps {
  team: {
    id: string;
    shortName: string;
    name: string;
  };
  primaryColor: string;
}

// Mock social media links - in production, these would come from team data
const getSocialLinks = (teamId: string, shortName: string) => {
  const baseLinks: { [key: string]: any } = {
    '1': { // RCB
      twitter: 'https://twitter.com/RCBTweets',
      facebook: 'https://www.facebook.com/RCBTweets',
      instagram: 'https://www.instagram.com/royalchallengersbangalore',
      youtube: 'https://www.youtube.com/c/RCBTweets',
      website: 'https://www.royalchallengers.com',
    },
    '2': { // MI
      twitter: 'https://twitter.com/mipaltan',
      facebook: 'https://www.facebook.com/MumbaiIndians',
      instagram: 'https://www.instagram.com/mumbaiindians',
      youtube: 'https://www.youtube.com/c/MumbaiIndians',
      website: 'https://www.mumbaiindians.com',
    },
    // Add more teams as needed
  };

  return baseLinks[teamId] || {
    twitter: `https://twitter.com/${shortName.toLowerCase()}`,
    facebook: `https://www.facebook.com/${shortName.toLowerCase()}`,
    instagram: `https://www.instagram.com/${shortName.toLowerCase()}`,
    youtube: `https://www.youtube.com/c/${shortName.toLowerCase()}`,
    website: `https://www.${shortName.toLowerCase()}.com`,
  };
};

export default function SocialMediaLinks({ team, primaryColor }: SocialMediaLinksProps) {
  const links = getSocialLinks(team.id.replace('team', ''), team.shortName);

  const socialPlatforms = [
    { name: 'Twitter', icon: Twitter, url: links.twitter, color: '#1DA1F2' },
    { name: 'Facebook', icon: Facebook, url: links.facebook, color: '#1877F2' },
    { name: 'Instagram', icon: Instagram, url: links.instagram, color: '#E4405F' },
    { name: 'YouTube', icon: Youtube, url: links.youtube, color: '#FF0000' },
    { name: 'Website', icon: Globe, url: links.website, color: primaryColor },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Globe className="w-5 h-5" style={{ color: primaryColor }} />
        Follow {team.shortName}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {socialPlatforms.map((platform, index) => {
          const Icon = platform.icon;
          return (
            <motion.a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 group"
              style={{
                boxShadow: `0 0 20px ${platform.color}20`,
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon
                  className="w-6 h-6"
                  style={{ color: platform.color }}
                />
                <span className="text-xs font-semibold text-white">{platform.name}</span>
                <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: platform.color }}
              />
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}

