import React, { useEffect, useRef } from 'react';
import { Card, Typography } from 'antd';
import { FIVE_ELEMENTS_COLORS } from '../constants';

const { Title } = Typography;

interface EnergyDNAProps {
  birthStats: Array<{
    element: string;
    count: number;
    percentage: number;
  }>;
  currentStats: Array<{
    element: string;
    count: number;
    percentage: number;
  }>;
}

const EnergyDNA: React.FC<EnergyDNAProps> = ({ birthStats, currentStats }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 400;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const width = canvas.width;
    const height = canvas.height;
    
    // DNA参数
    const dnaLength = height * 0.8;
    const dnaWidth = width * 0.25;
    const centerX = width / 2;
    const startY = height * 0.1;
    const rotationSpeed = 0.0002;
    const amplitude = dnaWidth / 2;

    // 准备五行数据
    const birthElements: Array<{element: string; percentage: number}> = [];
    const currentElements: Array<{element: string; percentage: number}> = [];
    
    birthStats.forEach(stat => {
      for (let i = 0; i < stat.count; i++) {
        birthElements.push({
          element: stat.element,
          percentage: stat.percentage
        });
      }
    });
    
    currentStats.forEach(stat => {
      for (let i = 0; i < stat.count; i++) {
        currentElements.push({
          element: stat.element,
          percentage: stat.percentage
        });
      }
    });

    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#001529');
    gradient.addColorStop(1, '#002140');

    // 创建动画函数
    const animate = () => {
      // 清除画布
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const time = Date.now() * rotationSpeed;
      const points = 100;

      // 绘制DNA骨架线（双螺旋）
      // 第一条骨架线（先天）
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < points; i++) {
        const progress = i / points;
        const y = startY + progress * dnaLength;
        const x = centerX + Math.sin(progress * Math.PI * 3 - time) * amplitude;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // 当下骨架线（虚线）
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < points; i++) {
        const progress = i / points;
        const y = startY + progress * dnaLength;
        const x = centerX + Math.sin(progress * Math.PI * 3 - time + Math.PI) * amplitude;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 计算每个能量球的位置
      const birthSpacing = points / birthElements.length;
      const currentSpacing = points / currentElements.length;

      // 绘制先天能量球和连接线
      birthElements.forEach((element, index) => {
        const progress = (index * birthSpacing) / points;
        const y = startY + progress * dnaLength;
        const leftX = centerX + Math.sin(progress * Math.PI * 3 - time) * amplitude;
        const rightX = centerX + Math.sin(progress * Math.PI * 3 - time + Math.PI) * amplitude;

        // 绘制先天能量球（珠子）
        const radius = (element.percentage / 100) * 12 + 4;
        
        // 添加发光效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = FIVE_ELEMENTS_COLORS[element.element as keyof typeof FIVE_ELEMENTS_COLORS];
        
        // 创建径向渐变
        const grd = ctx.createRadialGradient(
          leftX - radius/3, y - radius/3, 0,  // 内圆中心点和半径
          leftX, y, radius  // 外圆中心点和半径
        );
        grd.addColorStop(0, '#ffffff');  // 中心点为白色
        grd.addColorStop(0.2, FIVE_ELEMENTS_COLORS[element.element as keyof typeof FIVE_ELEMENTS_COLORS]);
        grd.addColorStop(1, FIVE_ELEMENTS_COLORS[element.element as keyof typeof FIVE_ELEMENTS_COLORS]);
        
        // 绘制实心圆
        ctx.beginPath();
        ctx.arc(leftX, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        
        // 添加高光效果
        ctx.beginPath();
        ctx.arc(leftX - radius/3, y - radius/3, radius/4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        // 添加能量场效果
        const glowGrd = ctx.createRadialGradient(leftX, y, 0, leftX, y, radius * 2);
        glowGrd.addColorStop(0, `${FIVE_ELEMENTS_COLORS[element.element as keyof typeof FIVE_ELEMENTS_COLORS]}22`);
        glowGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrd;
        ctx.beginPath();
        ctx.arc(leftX, y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 绘制当下能量球（带圈的珠子）
      currentElements.forEach((element, index) => {
        const progress = (index * currentSpacing) / points;
        const y = startY + progress * dnaLength;
        const rightX = centerX + Math.sin(progress * Math.PI * 3 - time + Math.PI) * amplitude;

        const radius = (element.percentage / 100) * 12 + 4;
        
        // 添加发光效果
        ctx.shadowBlur = 15;
        ctx.shadowColor = FIVE_ELEMENTS_COLORS[element.element as keyof typeof FIVE_ELEMENTS_COLORS];
        
        // 绘制外环
        ctx.beginPath();
        ctx.arc(rightX, y, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 创建径向渐变
        const grd = ctx.createRadialGradient(
          rightX - radius/3, y - radius/3, 0,  // 内圆中心点和半径
          rightX, y, radius  // 外圆中心点和半径
        );
        grd.addColorStop(0, '#ffffff');  // 中心点为白色
        grd.addColorStop(0.2, FIVE_ELEMENTS_COLORS[element.element as keyof typeof FIVE_ELEMENTS_COLORS]);
        grd.addColorStop(1, FIVE_ELEMENTS_COLORS[element.element as keyof typeof FIVE_ELEMENTS_COLORS]);
        
        // 绘制实心圆
        ctx.beginPath();
        ctx.arc(rightX, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        
        // 添加高光效果
        ctx.beginPath();
        ctx.arc(rightX - radius/3, y - radius/3, radius/4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        // 添加能量场效果
        const glowGrd = ctx.createRadialGradient(rightX, y, 0, rightX, y, radius * 2.5);
        glowGrd.addColorStop(0, `${FIVE_ELEMENTS_COLORS[element.element as keyof typeof FIVE_ELEMENTS_COLORS]}33`);
        glowGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrd;
        ctx.beginPath();
        ctx.arc(rightX, y, radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 重置阴影效果
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [birthStats, currentStats]);

  return (
    <Card title="能量DNA图谱" bordered={false}>
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%',
          height: '400px',
          background: '#001529',
          borderRadius: '8px'
        }}
      />
    </Card>
  );
};

export default EnergyDNA; 