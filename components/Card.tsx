
import React, { ReactNode } from 'react';

interface CardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red: 'bg-red-100 text-red-600',
};

const Card: React.FC<CardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 space-x-reverse">
      <div className={`p-4 rounded-full ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-black font-medium">{title}</p>
        <p className="text-3xl font-bold text-black">{value}</p>
      </div>
    </div>
  );
};

export default Card;