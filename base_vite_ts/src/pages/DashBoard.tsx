import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarIcon } from "lucide-react";

const Dashboard: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  const transformDataToMonths = (data: any[]) => {
    const months = Array(12).fill(0);
    data.forEach((item) => {
      const monthIndex = new Date(item.date).getMonth();
      months[monthIndex] += item.value;
    });

    return months.map((value, index) => ({
      month: new Date(2025, index, 1).toLocaleString("en-US", { month: "short" }),
      value,
    }));
  };

  const [keyX, setKeyX] = useState("month");

  const fetchStatistics = async () => {
    try {
      let url = "http://localhost:8080/dashboard";
      let isFiltered = false;

      if (startDate && endDate) {
        url += `?start=${startDate}&end=${endDate}`;
        isFiltered = true;
      }

      console.log("📡 Gọi API với URL:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);

      const fetchedData = await response.json();
      console.log("📊 Dữ liệu gốc:", fetchedData);

      // Cập nhật số lượng đơn hàng & tổng giá trị đơn hàng
      setTotalOrders(fetchedData.length);
      setTotalValue(fetchedData.reduce((sum, item) => sum + item.value, 0));

      const transformedData = isFiltered ? fetchedData : transformDataToMonths(fetchedData);
      setKeyX(isFiltered ? "date" : "month");
      setData(transformedData);
    } catch (error) {
      console.error("❌ Lỗi khi lấy dữ liệu:", error);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <Card className="p-4">
        <div className="flex gap-4 mb-4 items-center">
          <div className="relative">
            <CalendarIcon className="absolute left-2 top-2.5 text-gray-500" size={20} />
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-8" />
          </div>
          <div className="relative">
            <CalendarIcon className="absolute left-2 top-2.5 text-gray-500" size={20} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-8" />
          </div>
          <Button onClick={fetchStatistics}>Xem thống kê</Button>
        </div>

        {/* 📌 Thông tin tổng quan */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <Card className="p-4 bg-blue-100">
            <h3 className="text-lg font-semibold">📦 Tổng số đơn hàng</h3>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </Card>
          <Card className="p-4 bg-green-100">
            <h3 className="text-lg font-semibold">💰 Tổng giá trị đơn hàng</h3>
            <p className="text-2xl font-bold">{totalValue.toLocaleString()} VND</p>
          </Card>
        </div>

        <CardContent>
          {data.length === 0 ? (
            <div className="text-center text-gray-500 mt-4">⚠️ Không có dữ liệu để hiển thị.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <XAxis dataKey={keyX} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
