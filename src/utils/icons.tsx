import React from 'react';
import {
  Utensils,
  Home,
  Car,
  Receipt,
  HeartPulse,
  ShoppingBag,
  Smile,
  Laptop,
  MoreHorizontal,
  Briefcase,
  Coins,
  TrendingUp,
  Gift,
  GraduationCap,
  Coffee,
  Bus,
  Plane,
  Music,
  Film,
  Smartphone,
  Zap,
  CreditCard,
  PiggyBank,
  Tag,
  HelpCircle,
  Wallet,
  Folder,
  Sliders,
  DollarSign,
  type LucideProps
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const ICON_OPTIONS = [
  { name: 'Utensils', label: 'Alimentation', icon: Utensils },
  { name: 'Home', label: 'Logement', icon: Home },
  { name: 'Car', label: 'Transport', icon: Car },
  { name: 'Bus', label: 'Transport en commun', icon: Bus },
  { name: 'Receipt', label: 'Factures', icon: Receipt },
  { name: 'HeartPulse', label: 'Santé', icon: HeartPulse },
  { name: 'ShoppingBag', label: 'Shopping', icon: ShoppingBag },
  { name: 'Smile', label: 'Loisirs', icon: Smile },
  { name: 'Coffee', label: 'Café & Resto', icon: Coffee },
  { name: 'Laptop', label: 'Tech & Travail', icon: Laptop },
  { name: 'Briefcase', label: 'Emploi / Salaire', icon: Briefcase },
  { name: 'Coins', label: 'Finance / Extra', icon: Coins },
  { name: 'TrendingUp', label: 'Investissement', icon: TrendingUp },
  { name: 'Gift', label: 'Cadeau', icon: Gift },
  { name: 'GraduationCap', label: 'Études', icon: GraduationCap },
  { name: 'Plane', label: 'Voyage', icon: Plane },
  { name: 'Smartphone', label: 'Téléphonie', icon: Smartphone },
  { name: 'Zap', label: 'Énergie', icon: Zap },
  { name: 'CreditCard', label: 'Banque', icon: CreditCard },
  { name: 'PiggyBank', label: 'Épargne', icon: PiggyBank },
  { name: 'MoreHorizontal', label: 'Divers', icon: MoreHorizontal }
];

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', ...props }) => {
  switch (name) {
    case 'Utensils': return <Utensils className={className} {...props} />;
    case 'Home': return <Home className={className} {...props} />;
    case 'Car': return <Car className={className} {...props} />;
    case 'Bus': return <Bus className={className} {...props} />;
    case 'Receipt': return <Receipt className={className} {...props} />;
    case 'HeartPulse': return <HeartPulse className={className} {...props} />;
    case 'ShoppingBag': return <ShoppingBag className={className} {...props} />;
    case 'Smile': return <Smile className={className} {...props} />;
    case 'Coffee': return <Coffee className={className} {...props} />;
    case 'Laptop': return <Laptop className={className} {...props} />;
    case 'Briefcase': return <Briefcase className={className} {...props} />;
    case 'Coins': return <Coins className={className} {...props} />;
    case 'TrendingUp': return <TrendingUp className={className} {...props} />;
    case 'Gift': return <Gift className={className} {...props} />;
    case 'GraduationCap': return <GraduationCap className={className} {...props} />;
    case 'Plane': return <Plane className={className} {...props} />;
    case 'Music': return <Music className={className} {...props} />;
    case 'Film': return <Film className={className} {...props} />;
    case 'Smartphone': return <Smartphone className={className} {...props} />;
    case 'Zap': return <Zap className={className} {...props} />;
    case 'CreditCard': return <CreditCard className={className} {...props} />;
    case 'PiggyBank': return <PiggyBank className={className} {...props} />;
    case 'Tag': return <Tag className={className} {...props} />;
    case 'Wallet': return <Wallet className={className} {...props} />;
    case 'Folder': return <Folder className={className} {...props} />;
    default: return <MoreHorizontal className={className} {...props} />;
  }
};
