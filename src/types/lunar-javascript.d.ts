declare module 'lunar-javascript' {
  export class Lunar {
    static fromDate(date: Date): Lunar;
    getYearInGanZhi(): [string, string];
    getMonthInGanZhi(): [string, string];
    getDayInGanZhi(): [string, string];
    getTimeInGanZhi(): [string, string];
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
  }
} 