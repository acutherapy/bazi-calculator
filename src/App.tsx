import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Space, Card, Row, Col, Select, Form, Progress, Table, Divider } from 'antd';
import { Lunar } from 'lunar-javascript';
import './App.css';
import EnergyDNA from './components/EnergyDNA';
import { FIVE_ELEMENTS_COLORS } from './constants';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// 天干
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

// 地支
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 时辰对照表
const CHINESE_HOURS = [
  { branch: '子', label: '子时 23:00-00:59', value: 23 },
  { branch: '丑', label: '丑时 01:00-02:59', value: 1 },
  { branch: '寅', label: '寅时 03:00-04:59', value: 3 },
  { branch: '卯', label: '卯时 05:00-06:59', value: 5 },
  { branch: '辰', label: '辰时 07:00-08:59', value: 7 },
  { branch: '巳', label: '巳时 09:00-10:59', value: 9 },
  { branch: '午', label: '午时 11:00-12:59', value: 11 },
  { branch: '未', label: '未时 13:00-14:59', value: 13 },
  { branch: '申', label: '申时 15:00-16:59', value: 15 },
  { branch: '酉', label: '酉时 17:00-18:59', value: 17 },
  { branch: '戌', label: '戌时 19:00-20:59', value: 19 },
  { branch: '亥', label: '亥时 21:00-22:59', value: 21 }
] as const;

// 五行
const FIVE_ELEMENTS_MAP = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  '子': '水', '丑': '土',
  '寅': '木', '卯': '木',
  '辰': '土', '巳': '火',
  '午': '火', '未': '土',
  '申': '金', '酉': '金',
  '戌': '土', '亥': '水'
} as const;

// 月干支表（按节气）
const MONTH_STEMS = {
  "甲己": ["丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉", "甲戌", "乙亥", "丙子", "丁丑"],
  "乙庚": ["戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未", "甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑"],
  "丙辛": ["庚寅", "辛卯", "壬辰", "癸巳", "甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑"],
  "丁壬": ["壬寅", "癸卯", "甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑"],
  "戊癸": ["甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥", "甲子", "乙丑"]
} as const;

interface BirthDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
}

interface BaziResult {
  year: [string, string];
  month: [string, string];
  day: [string, string];
  hour: [string, string];
  solarDate: string;
  lunarDate: string;
  fiveElements: {
    year: [string, string];
    month: [string, string];
    day: [string, string];
    hour: [string, string];
  };
}

// 五行理想比例
const IDEAL_RATIO = 0.2; // 20%

interface FiveElementStat {
  element: string;
  count: number;
  percentage: number;
}

interface DeviationResult {
  element: string;
  deviation: number;
  deviationPercentage: number;
  status: string;
}

// 计算五行失衡度
const calculateImbalance = (stats: FiveElementStat[]) => {
  // 计算每个五行与理想比例的偏差
  const deviations = stats.map(({ element, percentage }) => {
    const deviation = percentage / 100 - IDEAL_RATIO; // 不取绝对值，保留正负
    const deviationAbs = Math.abs(deviation);
    return {
      element,
      deviation,
      deviationPercentage: Math.round(deviation * 100),
      status: deviationAbs <= 0.05 ? '平衡' : 
              deviation > 0 ? (deviationAbs <= 0.1 ? '略多' : '过多') :
              deviationAbs <= 0.1 ? '略少' : '不足'
    };
  });

  // 计算总体失衡度
  const totalImbalance = deviations.reduce((sum, { deviation }) => sum + Math.abs(deviation), 0) / 5;
  const overallStatus = totalImbalance <= 0.05 ? '五行平衡' : 
                       totalImbalance <= 0.1 ? '五行轻度失衡' : '五行严重失衡';

  return {
    deviations,
    totalImbalance,
    overallStatus
  };
};

// 计算五行统计
const calculateFiveElementsStats = (bazi: BaziResult): FiveElementStat[] => {
  const stats = {
    '木': 0,
    '火': 0,
    '土': 0,
    '金': 0,
    '水': 0
  };

  // 统计所有柱中的五行
  Object.values(bazi.fiveElements).forEach(pillar => {
    pillar.forEach(element => {
      stats[element as keyof typeof stats]++;
    });
  });

  // 计算百分比
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  return Object.entries(stats).map(([element, count]) => ({
    element,
    count,
    percentage: Math.round((count / total) * 100)
  }));
};

function App() {
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<BirthDateTime | null>(null);
  const [bazi, setBazi] = useState<BaziResult | null>(null);
  const [currentBazi, setCurrentBazi] = useState<BaziResult | null>(null);
  const [days, setDays] = useState<number[]>([]);

  // 生成年份选项（1900-2100）
  const years = Array.from({ length: 201 }, (_, i) => 1900 + i);
  
  // 生成月份选项
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 更新日期选项
  const updateDays = (year?: number, month?: number) => {
    if (year && month) {
      const daysInMonth = new Date(year, month, 0).getDate();
      setDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
    }
  };

  // 初始化和监听表单变化
  useEffect(() => {
    const year = form.getFieldValue('year');
    const month = form.getFieldValue('month');
    updateDays(year, month);
  }, [form]);

  const handleFormChange = (changedValues: any, allValues: any) => {
    // 如果年或月发生变化，更新日期选项
    if ('year' in changedValues || 'month' in changedValues) {
      updateDays(allValues.year, allValues.month);
      // 如果当前选择的日期超出了新的月份的最大天数，重置日期
      const daysInMonth = new Date(allValues.year || 2000, allValues.month || 1, 0).getDate();
      if (allValues.day > daysInMonth) {
        form.setFieldValue('day', null);
      }
    }

    // 更新选中的日期时间
    if (allValues.year && allValues.month && allValues.day && allValues.hour !== undefined) {
      setSelectedDate({
        year: allValues.year,
        month: allValues.month,
        day: allValues.day,
        hour: allValues.hour
      });
    } else {
      setSelectedDate(null);
    }
  };

  const calculateBazi = () => {
    if (!selectedDate) return;

    const { year, month, day, hour } = selectedDate;
    
    // 创建农历日期对象
    const lunar = Lunar.fromDate(new Date(year, month - 1, day, hour));
    
    // 获取八字
    const yearGanZhi = lunar.getYearInGanZhi();
    const monthGanZhi = lunar.getMonthInGanZhi();
    const dayGanZhi = lunar.getDayInGanZhi();
    const timeGanZhi = lunar.getTimeInGanZhi();

    // 格式化日期显示
    const solarDateStr = `${year}年${month}月${day}日 ${hour}时`;
    const lunarDateStr = `农历${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;

    // 计算五行
    const fiveElements = {
      year: [FIVE_ELEMENTS_MAP[yearGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[yearGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string],
      month: [FIVE_ELEMENTS_MAP[monthGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[monthGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string],
      day: [FIVE_ELEMENTS_MAP[dayGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[dayGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string],
      hour: [FIVE_ELEMENTS_MAP[timeGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[timeGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string]
    };

    setBazi({
      year: yearGanZhi,
      month: monthGanZhi,
      day: dayGanZhi,
      hour: timeGanZhi,
      solarDate: solarDateStr,
      lunarDate: lunarDateStr,
      fiveElements
    });
  };

  // 计算当前时间的八字
  const calculateCurrentBazi = () => {
    const now = new Date();
    const lunar = Lunar.fromDate(now);
    
    const yearGanZhi = lunar.getYearInGanZhi();
    const monthGanZhi = lunar.getMonthInGanZhi();
    const dayGanZhi = lunar.getDayInGanZhi();
    const timeGanZhi = lunar.getTimeInGanZhi();

    const solarDateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}时`;
    const lunarDateStr = `农历${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;

    const fiveElements = {
      year: [FIVE_ELEMENTS_MAP[yearGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[yearGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string],
      month: [FIVE_ELEMENTS_MAP[monthGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[monthGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string],
      day: [FIVE_ELEMENTS_MAP[dayGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[dayGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string],
      hour: [FIVE_ELEMENTS_MAP[timeGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[timeGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string]
    };

    setCurrentBazi({
      year: yearGanZhi,
      month: monthGanZhi,
      day: dayGanZhi,
      hour: timeGanZhi,
      solarDate: solarDateStr,
      lunarDate: lunarDateStr,
      fiveElements
    });
  };

  // 每分钟更新当前八字
  useEffect(() => {
    calculateCurrentBazi();
    const timer = setInterval(calculateCurrentBazi, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout className="layout">
      <Header style={{ background: '#fff', padding: '0 50px' }}>
        <Title level={2} style={{ margin: '16px 0', textAlign: 'center' }}>八字计算器</Title>
      </Header>
      <Content style={{ padding: '24px 32px', minHeight: '80vh', background: '#f0f2f5', maxWidth: '1600px', margin: '0 auto' }}>
        <Row gutter={[24, 24]}>
          {/* 左侧面板 */}
          <Col span={12} style={{ minWidth: '700px' }}>
            <Card bordered={false} style={{ height: '100%' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Title level={3} style={{ margin: '0 0 24px 0', textAlign: 'center' }}>先天八字</Title>
                
                {/* 日期时辰选择区域 */}
                <Card title="出生日期与时辰" bordered={false} style={{ marginBottom: '24px' }}>
                  <Form
                    form={form}
                    onValuesChange={handleFormChange}
                    layout="horizontal"
                    style={{ maxWidth: '100%' }}
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Form.Item
                          name="year"
                          label={<span style={{ minWidth: '32px', display: 'inline-block' }}>年</span>}
                          rules={[{ required: true, message: '请选择年份' }]}
                        >
                          <Select 
                            placeholder="选择年份" 
                            showSearch
                            listHeight={200}
                            style={{ width: '100%', minWidth: '180px' }}
                            dropdownMatchSelectWidth={false}
                          >
                            {years.map(year => (
                              <Select.Option key={year} value={year}>{year}年</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="month"
                          label={<span style={{ minWidth: '32px', display: 'inline-block' }}>月</span>}
                          rules={[{ required: true, message: '请选择月份' }]}
                        >
                          <Select 
                            placeholder="选择月份"
                            listHeight={200}
                            style={{ width: '100%', minWidth: '180px' }}
                            dropdownMatchSelectWidth={false}
                          >
                            {months.map(month => (
                              <Select.Option key={month} value={month}>{month}月</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="day"
                          label={<span style={{ minWidth: '32px', display: 'inline-block' }}>日</span>}
                          rules={[{ required: true, message: '请选择日期' }]}
                        >
                          <Select 
                            placeholder="选择日期" 
                            disabled={days.length === 0}
                            listHeight={200}
                            style={{ width: '100%', minWidth: '180px' }}
                            dropdownMatchSelectWidth={false}
                          >
                            {days.map(day => (
                              <Select.Option key={day} value={day}>{day}日</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="hour"
                          label={<span style={{ minWidth: '32px', display: 'inline-block' }}>时辰</span>}
                          rules={[{ required: true, message: '请选择时辰' }]}
                        >
                          <Select 
                            placeholder="选择时辰"
                            listHeight={200}
                            style={{ width: '100%', minWidth: '180px' }}
                            dropdownMatchSelectWidth={false}
                          >
                            {CHINESE_HOURS.map(hour => (
                              <Select.Option key={hour.branch} value={hour.value}>
                                {hour.label}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>

                <Button 
                  type="primary" 
                  size="large" 
                  onClick={calculateBazi}
                  disabled={!selectedDate}
                  style={{ width: '200px', margin: '0 auto 24px', display: 'block' }}
                >
                  生成先天八字
                </Button>

                {/* 八字显示区域 */}
                {bazi && (
                  <>
                    <Card title="八字" bordered={false} style={{ marginBottom: '24px' }}>
                      <Row gutter={[16, 16]}>
                        <Col span={6}>
                          <Card title="年柱" bordered={false} size="small" style={{ minHeight: '120px' }}>
                            <Text strong style={{ fontSize: '16px' }}>{bazi.year[0]}{bazi.year[1]}</Text>
                            <br />
                            <Text type="secondary">五行：{bazi.fiveElements.year.join('/')}</Text>
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card title="月柱" bordered={false} size="small" style={{ minHeight: '120px' }}>
                            <Text strong style={{ fontSize: '16px' }}>{bazi.month[0]}{bazi.month[1]}</Text>
                            <br />
                            <Text type="secondary">五行：{bazi.fiveElements.month.join('/')}</Text>
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card title="日柱" bordered={false} size="small" style={{ minHeight: '120px' }}>
                            <Text strong style={{ fontSize: '16px' }}>{bazi.day[0]}{bazi.day[1]}</Text>
                            <br />
                            <Text type="secondary">五行：{bazi.fiveElements.day.join('/')}</Text>
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card title="时柱" bordered={false} size="small" style={{ minHeight: '120px' }}>
                            <Text strong style={{ fontSize: '16px' }}>{bazi.hour[0]}{bazi.hour[1]}</Text>
                            <br />
                            <Text type="secondary">五行：{bazi.fiveElements.hour.join('/')}</Text>
                          </Card>
                        </Col>
                      </Row>
                    </Card>

                    {/* 五行统计 */}
                    <Card title="五行分析" bordered={false}>
                      <Row gutter={[16, 16]}>
                        {/* 五行分布 */}
                        <Col span={24}>
                          <Title level={5}>五行分布</Title>
                          {calculateFiveElementsStats(bazi).map(({ element, count, percentage }) => (
                            <div key={element} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                              <Text strong style={{ width: '60px' }}>{element}：</Text>
                              <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '12px',
                                minHeight: '24px',
                                padding: '2px 8px',
                                marginRight: '8px'
                              }}>
                                {Array.from({ length: count }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      backgroundColor: FIVE_ELEMENTS_COLORS[element as keyof typeof FIVE_ELEMENTS_COLORS],
                                      borderRadius: '50%',
                                      marginRight: '4px',
                                      display: 'inline-block'
                                    }}
                                  />
                                ))}
                              </div>
                              <Text style={{ minWidth: '80px' }}>{count}个 ({percentage}%)</Text>
                            </div>
                          ))}
                        </Col>

                        {/* 五行失衡分析 */}
                        <Col span={24}>
                          <Title level={5} style={{ marginTop: '16px' }}>失衡分析</Title>
                          {(() => {
                            const stats = calculateFiveElementsStats(bazi);
                            const { deviations, totalImbalance, overallStatus } = calculateImbalance(stats);
                            return (
                              <>
                                <div style={{ marginBottom: '16px' }}>
                                  <Text strong>整体状态：</Text>
                                  <Text type={totalImbalance <= 0.05 ? 'success' : totalImbalance <= 0.1 ? 'warning' : 'danger'}>
                                    {overallStatus}（偏差：{Math.round(totalImbalance * 100)}%）
                                  </Text>
                                </div>
                                {deviations.map(({ element, deviation, deviationPercentage, status }) => {
                                  const elementStat = stats.find(s => s.element === element);
                                  if (!elementStat) return null;
                                  
                                  return (
                                    <div key={element} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                                      <Text style={{ width: '60px', display: 'inline-block' }}>{element}：</Text>
                                      <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: '12px',
                                        minHeight: '24px',
                                        padding: '2px 8px',
                                        marginRight: '8px'
                                      }}>
                                        {Array.from({ length: elementStat.count }).map((_, index) => (
                                          <div
                                            key={index}
                                            style={{
                                              width: '12px',
                                              height: '12px',
                                              backgroundColor: FIVE_ELEMENTS_COLORS[element as keyof typeof FIVE_ELEMENTS_COLORS],
                                              borderRadius: '50%',
                                              marginRight: '4px',
                                              display: 'inline-block'
                                            }}
                                          />
                                        ))}
                                      </div>
                                      <Text type={status === '平衡' ? 'success' : 
                                               (status === '略多' || status === '略少') ? 'warning' : 'danger'}
                                            style={{ minWidth: '120px' }}>
                                        {status}（{deviationPercentage > 0 ? '+' : ''}{deviationPercentage}%）
                                      </Text>
                                    </div>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </Col>
                      </Row>
                    </Card>
                  </>
                )}
              </Space>
            </Card>
          </Col>

          {/* 右侧面板 */}
          <Col span={12} style={{ minWidth: '700px' }}>
            <Card bordered={false} style={{ height: '100%' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Title level={3} style={{ margin: '0 0 24px 0', textAlign: 'center' }}>当下八字</Title>
                
                {/* 当前时间显示 */}
                <Card title="当前日期与时辰" bordered={false} style={{ marginBottom: '24px', minHeight: '183px' }}>
                  {currentBazi && (
                    <Row>
                      <Col span={24}>
                        <Text strong style={{ fontSize: '16px' }}>{currentBazi.solarDate}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '14px' }}>{currentBazi.lunarDate}</Text>
                      </Col>
                    </Row>
                  )}
                </Card>

                <div style={{ height: '76px' }}></div>

                {/* 八字显示区域 */}
                {currentBazi && (
                  <>
                    <Card title="八字" bordered={false} style={{ marginBottom: '24px' }}>
                      <Row gutter={[16, 16]}>
                        <Col span={6}>
                          <Card title="年柱" bordered={false} size="small" style={{ minHeight: '120px' }}>
                            <Text strong style={{ fontSize: '16px' }}>{currentBazi.year[0]}{currentBazi.year[1]}</Text>
                            <br />
                            <Text type="secondary">五行：{currentBazi.fiveElements.year.join('/')}</Text>
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card title="月柱" bordered={false} size="small" style={{ minHeight: '120px' }}>
                            <Text strong style={{ fontSize: '16px' }}>{currentBazi.month[0]}{currentBazi.month[1]}</Text>
                            <br />
                            <Text type="secondary">五行：{currentBazi.fiveElements.month.join('/')}</Text>
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card title="日柱" bordered={false} size="small" style={{ minHeight: '120px' }}>
                            <Text strong style={{ fontSize: '16px' }}>{currentBazi.day[0]}{currentBazi.day[1]}</Text>
                            <br />
                            <Text type="secondary">五行：{currentBazi.fiveElements.day.join('/')}</Text>
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card title="时柱" bordered={false} size="small" style={{ minHeight: '120px' }}>
                            <Text strong style={{ fontSize: '16px' }}>{currentBazi.hour[0]}{currentBazi.hour[1]}</Text>
                            <br />
                            <Text type="secondary">五行：{currentBazi.fiveElements.hour.join('/')}</Text>
                          </Card>
                        </Col>
                      </Row>
                    </Card>

                    {/* 五行统计 - 右侧面板 */}
                    <Card title="五行分析" bordered={false}>
                      <Row gutter={[16, 16]}>
                        {/* 五行分布 */}
                        <Col span={24}>
                          <Title level={5}>五行分布</Title>
                          {calculateFiveElementsStats(currentBazi).map(({ element, count, percentage }) => (
                            <div key={element} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                              <Text strong style={{ width: '60px' }}>{element}：</Text>
                              <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '12px',
                                minHeight: '24px',
                                padding: '2px 8px',
                                marginRight: '8px'
                              }}>
                                {Array.from({ length: count }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      backgroundColor: FIVE_ELEMENTS_COLORS[element as keyof typeof FIVE_ELEMENTS_COLORS],
                                      borderRadius: '50%',
                                      marginRight: '4px',
                                      display: 'inline-block'
                                    }}
                                  />
                                ))}
                              </div>
                              <Text style={{ minWidth: '80px' }}>{count}个 ({percentage}%)</Text>
                            </div>
                          ))}
                        </Col>

                        {/* 五行失衡分析 */}
                        <Col span={24}>
                          <Title level={5} style={{ marginTop: '16px' }}>失衡分析</Title>
                          {(() => {
                            const stats = calculateFiveElementsStats(currentBazi);
                            const { deviations, totalImbalance, overallStatus } = calculateImbalance(stats);
                            return (
                              <>
                                <div style={{ marginBottom: '16px' }}>
                                  <Text strong>整体状态：</Text>
                                  <Text type={totalImbalance <= 0.05 ? 'success' : totalImbalance <= 0.1 ? 'warning' : 'danger'}>
                                    {overallStatus}（偏差：{Math.round(totalImbalance * 100)}%）
                                  </Text>
                                </div>
                                {deviations.map(({ element, deviation, deviationPercentage, status }) => {
                                  const elementStat = stats.find(s => s.element === element);
                                  if (!elementStat) return null;
                                  
                                  return (
                                    <div key={element} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                                      <Text style={{ width: '60px', display: 'inline-block' }}>{element}：</Text>
                                      <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: '12px',
                                        minHeight: '24px',
                                        padding: '2px 8px',
                                        marginRight: '8px'
                                      }}>
                                        {Array.from({ length: elementStat.count }).map((_, index) => (
                                          <div
                                            key={index}
                                            style={{
                                              width: '12px',
                                              height: '12px',
                                              backgroundColor: FIVE_ELEMENTS_COLORS[element as keyof typeof FIVE_ELEMENTS_COLORS],
                                              borderRadius: '50%',
                                              marginRight: '4px',
                                              display: 'inline-block'
                                            }}
                                          />
                                        ))}
                                      </div>
                                      <Text type={status === '平衡' ? 'success' : 
                                               (status === '略多' || status === '略少') ? 'warning' : 'danger'}
                                            style={{ minWidth: '120px' }}>
                                        {status}（{deviationPercentage > 0 ? '+' : ''}{deviationPercentage}%）
                                      </Text>
                                    </div>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </Col>
                      </Row>
                    </Card>

                    {/* 先天与当下五行总和分析 */}
                    {bazi && currentBazi && (
                      <Card title="先天与当下五行总和分析" bordered={false} style={{ marginTop: '24px' }}>
                        <Row gutter={[16, 16]}>
                          <Col span={24}>
                            {(() => {
                              const birthStats = calculateFiveElementsStats(bazi);
                              const currentStats = calculateFiveElementsStats(currentBazi);
                              
                              // 计算总和
                              const combinedStats = birthStats.map(({ element }) => {
                                const birthElement = birthStats.find(stat => stat.element === element);
                                const currentElement = currentStats.find(stat => stat.element === element);
                                const totalCount = (birthElement?.count || 0) + (currentElement?.count || 0);
                                return {
                                  element,
                                  count: totalCount,
                                  percentage: Math.round((totalCount / 16) * 100) // 总共16个五行
                                };
                              });

                              const { deviations, totalImbalance, overallStatus } = calculateImbalance(combinedStats);

                              return (
                                <>
                                  <Title level={5}>五行分布</Title>
                                  {combinedStats.map(stat => {
                                    const deviation = deviations.find(d => d.element === stat.element);
                                    const birthElement = birthStats.find(s => s.element === stat.element);
                                    const currentElement = currentStats.find(s => s.element === stat.element);
                                    if (!deviation || !birthElement || !currentElement) return null;
                                    
                                    return (
                                      <div key={stat.element} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                        <Text strong style={{ width: '60px' }}>{stat.element}：</Text>
                                        <div style={{
                                          flex: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          backgroundColor: '#f5f5f5',
                                          borderRadius: '12px',
                                          minHeight: '24px',
                                          padding: '2px 8px',
                                          marginRight: '8px'
                                        }}>
                                          {/* 先天点（圆形） */}
                                          {Array.from({ length: birthElement.count }).map((_, idx) => (
                                            <div
                                              key={`birth-${idx}`}
                                              style={{
                                                width: '12px',
                                                height: '12px',
                                                backgroundColor: FIVE_ELEMENTS_COLORS[stat.element as keyof typeof FIVE_ELEMENTS_COLORS],
                                                borderRadius: '50%',
                                                marginRight: '4px',
                                                display: 'inline-block'
                                              }}
                                            />
                                          ))}
                                          {/* 当下点（方形） */}
                                          {Array.from({ length: currentElement.count }).map((_, idx) => (
                                            <div
                                              key={`current-${idx}`}
                                              style={{
                                                width: '12px',
                                                height: '12px',
                                                backgroundColor: FIVE_ELEMENTS_COLORS[stat.element as keyof typeof FIVE_ELEMENTS_COLORS],
                                                borderRadius: '0',
                                                marginRight: '4px',
                                                display: 'inline-block'
                                              }}
                                            />
                                          ))}
                                        </div>
                                        <Text style={{ minWidth: '120px' }}>
                                          {stat.count}个 ({deviation.deviationPercentage > 0 ? '+' : ''}{deviation.deviationPercentage}%)
                                          <br />
                                          <Text type="secondary" style={{ fontSize: '12px' }}>
                                            先天: {birthElement.count} | 当下: {currentElement.count}
                                          </Text>
                                        </Text>
                                      </div>
                                    );
                                  })}

                                  <Divider />
                                  <Title level={5}>总体失衡分析</Title>
                                  <div style={{ marginBottom: '16px' }}>
                                    <Text strong>整体状态：</Text>
                                    <Text type={totalImbalance <= 0.05 ? 'success' : totalImbalance <= 0.1 ? 'warning' : 'danger'}>
                                      {overallStatus}（总偏差：{Math.round(totalImbalance * 100)}%）
                                    </Text>
                                  </div>
                                  {deviations.map(({ element, deviationPercentage, status }) => (
                                    <div key={element} style={{ marginBottom: '16px' }}>
                                      <Text style={{ width: '60px' }}>{element}：</Text>
                                      <Text type={status === '平衡' ? 'success' : 
                                               (status === '略多' || status === '略少') ? 'warning' : 'danger'}>
                                        {status}（{deviationPercentage > 0 ? '+' : ''}{deviationPercentage}%）
                                      </Text>
                                    </div>
                                  ))}
                                </>
                              );
                            })()}
                          </Col>
                        </Row>
                      </Card>
                    )}
                    
                    {/* 能量DNA图谱 */}
                    {bazi && currentBazi && (
                      <EnergyDNA
                        birthStats={calculateFiveElementsStats(bazi)}
                        currentStats={calculateFiveElementsStats(currentBazi)}
                      />
                    )}
                  </>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default App;
