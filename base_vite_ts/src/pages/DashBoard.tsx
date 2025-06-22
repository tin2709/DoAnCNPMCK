import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  CalendarIcon,
  ArrowLeftIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
} from "lucide-react";

// === ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU (Interfaces) ===
// Dữ liệu cho biểu đồ đường
interface Order {
  date: string;
  value: number;
}

// Dữ liệu hiển thị trên biểu đồ
interface ChartDataPoint {
  [key: string]: string | number;
}

// Dữ liệu từ API /summary
interface SummaryStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  newCustomers: number;
  comparison: {
    revenueComparison: number;
    ordersComparison: number;
  };
}

// Dữ liệu từ API /top-products
interface TopProduct {
  product: {
    id: number;
    productName: string;
  };
  totalQuantity: number;
  totalRevenue: number;
}


// === COMPONENT DASHBOARD ===
const Dashboard: React.FC = () => {
  // --- State Management ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  // State cho các chỉ số tổng quan
  const [summary, setSummary] = useState<SummaryStats | null>(null);

  // State cho biểu đồ doanh thu (line chart) và logic drill-down
  const [originalOrderData, setOriginalOrderData] = useState<Order[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<ChartDataPoint[]>([]);
  const [currentView, setCurrentView] = useState<'monthly' | 'daily'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // State cho Top sản phẩm (bar chart)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);


  // --- Data Transformation ---
  const transformDataToMonths = (data: Order[]): ChartDataPoint[] => {
    const months = Array(12).fill(0).map(() => ({ value: 0, orderCount: 0 }));
    data.forEach((item) => {
      const monthIndex = new Date(item.date).getMonth();
      months[monthIndex].value += item.value;
      months[monthIndex].orderCount += 1;
    });
    return months.map((data, index) => ({
      month: new Date(2025, index, 1).toLocaleString("en-US", { month: "short" }),
      value: data.value,
      "Số đơn hàng": data.orderCount,
    }));
  };

  // --- API Fetching ---
  const fetchDashboardData = async () => {
    setLoading(true);
    // Reset view về trạng thái ban đầu mỗi khi lọc
    setCurrentView('monthly');
    setSelectedMonth(null);

    try {
      // 1. Lấy token và tạo headers
      const token = localStorage.getItem("accessToken");

      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      headers.append("Authorization", `Bearer ${token}`);

      // 2. Xây dựng query string và các URL
      const dateQuery = (startDate && endDate) ? `?start=${startDate}&end=${endDate}` : '';
      const apiUrls = {
        summary: `http://localhost:8080/api/orders/summary${dateQuery}`,
        orders: `http://localhost:8080/api/orders${dateQuery}`,
        topProducts: `http://localhost:8080/api/orders/top-products${dateQuery}&sortBy=revenue&limit=5`
      };

      // 3. Gọi các API song song
      const [summaryRes, ordersRes, topProductsRes] = await Promise.all([
        fetch(apiUrls.summary, { headers }),
        fetch(apiUrls.orders, { headers }),
        fetch(apiUrls.topProducts, { headers })
      ]);

      // 4. Kiểm tra lỗi chung cho tất cả response


      // 5. Lấy dữ liệu JSON
      const summaryData: SummaryStats = await summaryRes.json();
      const ordersData: Order[] = await ordersRes.json();
      const topProductsData: TopProduct[] = await topProductsRes.json();

      // 6. Cập nhật tất cả state
      setSummary(summaryData);
      setOriginalOrderData(ordersData);
      setRevenueChartData(transformDataToMonths(ordersData));
      setTopProducts(topProductsData);

    } catch (error) {
      console.error("❌ Lỗi khi lấy dữ liệu cho dashboard:", error);
      // Có thể reset state về rỗng ở đây nếu muốn
      setSummary(null);
      setOriginalOrderData([]);
      setRevenueChartData([]);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi component được mount

  const handleFilter = () => {
    fetchDashboardData();
  };


  // --- Event Handlers for Drill-Down ---
  const handleChartClick = (data: any) => {
    if (currentView !== 'monthly' || !data || !data.activePayload || data.activePayload.length === 0) {
      return;
    }
    const clickedMonthName = data.activePayload[0].payload.month;
    const monthIndex = new Date(Date.parse(clickedMonthName +" 1, 2025")).getMonth();
    const dailyDataForMonth = originalOrderData
      .filter(order => new Date(order.date).getMonth() === monthIndex)
      .map(order => ({
        date: new Date(order.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit'}),
        value: order.value,
      }));
    setRevenueChartData(dailyDataForMonth);
    setCurrentView('daily');
    setSelectedMonth(clickedMonthName);
  };

  const handleDrillUp = () => {
    setRevenueChartData(transformDataToMonths(originalOrderData));
    setCurrentView('monthly');
    setSelectedMonth(null);
  };

  // --- Render Helper ---
  const renderComparison = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return null;
    const isPositive = value >= 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    return (
      <span className={`flex items-center text-sm font-medium ${color} mt-1`}>
            <Icon className="h-4 w-4 mr-1" />
        {value.toFixed(1)}% so với kỳ trước
        </span>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Tổng Quan</h2>

      {/* --- BỘ LỌC --- */}
      <Card className="p-4 sm:p-6 shadow-sm border-gray-200 rounded-xl mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-grow min-w-[150px]">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                const newStartDate = e.target.value; // Lấy giá trị mới từ event
                console.log("Start Date đã chọn:", newStartDate); // In giá trị ra console
                setStartDate(newStartDate); // Cập nhật state như cũ
              }}
              className="pl-10"
            />
          </div>
          <div className="relative flex-grow min-w-[150px]">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                const newEndDate = e.target.value; // Lấy giá trị mới từ event
                console.log("End Date đã chọn:", newEndDate); // In giá trị ra console
                setEndDate(newEndDate); // Cập nhật state như cũ
              }}
              className="pl-10"
            />
          </div>
          <Button onClick={handleFilter} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Lọc dữ liệu</Button>
        </div>
      </Card>

      {/* --- CÁC CHỈ SỐ TỔNG QUAN --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-4"><CardContent className="p-0 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between"><h3 className="text-sm font-medium text-gray-500">TỔNG DOANH THU</h3><DollarSign className="h-5 w-5 text-gray-400"/></div>
            <p className="text-2xl font-bold mt-1">{summary?.totalRevenue.toLocaleString() || 0} VND</p>
          </div>
          {renderComparison(summary?.comparison.revenueComparison)}
        </CardContent></Card>
        <Card className="p-4"><CardContent className="p-0 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between"><h3 className="text-sm font-medium text-gray-500">TỔNG ĐƠN HÀNG</h3><ShoppingCart className="h-5 w-5 text-gray-400"/></div>
            <p className="text-2xl font-bold mt-1">{summary?.totalOrders.toLocaleString() || 0}</p>
          </div>
          {renderComparison(summary?.comparison.ordersComparison)}
        </CardContent></Card>
        <Card className="p-4"><CardContent className="p-0">
          <h3 className="text-sm font-medium text-gray-500">GIÁ TRỊ ĐƠN TB (AOV)</h3>
          <p className="text-2xl font-bold mt-1">{summary?.averageOrderValue.toLocaleString() || 0} VND</p>
        </CardContent></Card>
        <Card className="p-4"><CardContent className="p-0">
          <h3 className="text-sm font-medium text-gray-500">KHÁCH HÀNG MỚI</h3>
          <p className="text-2xl font-bold mt-1">{summary?.newCustomers.toLocaleString() || 0}</p>
        </CardContent></Card>
      </div>

      {/* --- CÁC BIỂU ĐỒ CHI TIẾT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Biểu đồ doanh thu (chiếm 3/5) */}
        <Card className="lg:col-span-3 p-4 shadow-lg">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              {currentView === 'daily' && (<Button onClick={handleDrillUp} variant="ghost" className="text-indigo-600 hover:bg-indigo-100 -ml-4"><ArrowLeftIcon className="mr-2 h-4 w-4" />Quay lại</Button>)}
              <h3 className="text-xl font-bold text-gray-700 text-center flex-1">{currentView === 'monthly' ? "Doanh thu theo tháng" : `Chi tiết tháng ${selectedMonth}`}</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueChartData} onClick={handleChartClick} style={{ cursor: currentView === 'monthly' ? 'pointer' : 'default' }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={currentView === 'monthly' ? 'month' : 'date'}/>
                <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(value as number)}/>
                <Tooltip formatter={(value:any) => [`${value.toLocaleString()} VND`, 'Doanh thu']}/>
                <Legend />
                <Line type="monotone" dataKey="value" name="Doanh thu" stroke="#4F46E5" />
                {currentView === 'monthly' && <Line type="monotone" dataKey="Số đơn hàng" name="Số đơn hàng" stroke="#22c55e" yAxisId="right"/>}
                {currentView === 'monthly' && <YAxis yAxisId="right" orientation="right" tick={{ fill: '#22c55e' }} />}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ Top sản phẩm (chiếm 2/5) */}
        <Card className="lg:col-span-2 p-4 shadow-lg">
          <CardContent>
            <h3 className="text-xl font-bold text-gray-700 mb-4">Top 5 Sản phẩm Doanh thu cao</h3>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `${(value as number / 1000000).toFixed(1)}M`}/>
                  <YAxis dataKey="product.productName" type="category" width={120} tick={{ fontSize: 12, textAnchor: 'end' }} interval={0}/>
                  <Tooltip formatter={(value:any) => [`${value.toLocaleString()} VND`, 'Doanh thu']}/>
                  <Legend />
                  <Bar dataKey="totalRevenue" name="Doanh thu" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">Không có dữ liệu sản phẩm.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;