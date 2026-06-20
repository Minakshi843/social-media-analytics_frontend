export interface User {
  id: number;
  username: string;
  role: string;
}

export interface City {
  id: number;
  name: string;
  createdAt?: string;
}

export interface SocialAccount {
  id: number;
  city: City;
  accountName: string;
  accountUrl: string;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'X';
  createdAt?: string;
}

export interface Target {
  id: number;
  city: City;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'X';
  dailyStaticTarget: number;
  dailyCarouselTarget: number;
  dailyReelTarget: number;
  dailyPostTarget: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  id: number;
  postId: string;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'X';
  city: City;
  postUrl: string;
  caption: string;
  postDate: string;
  postTime: string;
  postType: 'STATIC' | 'REEL' | 'CAROUSEL';
  likes: number;
  comments: number;
  reach: number;
  impressions: number;
}

export interface Analytics {
  id: number;
  city: City;
  date: string;
  platform: string;
  staticCount: number;
  carouselCount: number;
  reelCount: number;
  postCount: number;
}

export interface Report {
  id: number;
  reportType: string;
  generatedAt: string;
  filePath: string;
  city?: City;
}

export interface PlatformStat {
  platform: string;
  posts: number;
}

export interface CityStat {
  cityId: number;
  cityName: string;
  posts: number;
  achievementRate: number;
  pending: number;
}

export interface TrendStat {
  label: string;
  staticCount: number;
  carouselCount: number;
  reelCount: number;
  totalCount: number;
}

export interface DashboardStats {
  totalCities: number;
  totalAccounts: number;
  totalPosts: number;
  achievementRate: number;
  pendingTargets: number;
  platformPerformance: PlatformStat[];
  cityPerformance: CityStat[];
  monthlyTrends: TrendStat[];
  dailyTrends: TrendStat[];
}
