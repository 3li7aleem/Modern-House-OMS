
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Order } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../contexts/LanguageContext';


interface SalesChartProps {
    ordersData?: Order[];
}

const SalesChart: React.FC<SalesChartProps> = ({ ordersData = [] }) => {
    const { theme } = useTheme();
    const { t, formatCurrency } = useTranslation();
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';


    // Process data for the last 7 days
    const last7DaysData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return {
            date: d.toLocaleDateString('en-US', { weekday: 'short' }),
            sales: 0
        };
    }).reverse();

    (ordersData || []).forEach(order => {
        if (!order || !order.date) return;
        const orderDate = new Date(order.date);
        if (isNaN(orderDate.getTime())) return;
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));

        if (diffDays >= 0 && diffDays < 7 && last7DaysData[6 - diffDays]) {
            last7DaysData[6 - diffDays].sales += (order.total || 0);
        }
    });

    return (
        <div style={{ width: '100%', minHeight: 100 }}>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={last7DaysData}
                    margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2D3748' : '#E2E8F0'}/>
                    <XAxis dataKey="date" tick={{ fill: tickColor }} />
                    <YAxis tickFormatter={(tick) => formatCurrency(tick).replace('BHD', '').replace('د.ب.‏', '')} tick={{ fill: tickColor }} />
                    <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), t('dashboard.chart.sales')]} 
                        contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#E2E8F0'}`}}
                        labelStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}
                    />
                    <Legend wrapperStyle={{ color: tickColor }}/>
                    <Line type="monotone" dataKey="sales" stroke="#4f46e5" activeDot={{ r: 8 }} strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesChart;