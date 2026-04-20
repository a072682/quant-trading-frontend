import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ParamChart({ data }) {
  return (
    <div className="param-chart">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
          <XAxis dataKey="date" stroke="#8ab4d4" tick={{ fontSize: 11 }} />
          <YAxis stroke="#8ab4d4" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e0f0ff" }}
          />
          <Legend />
          <Line type="monotone" dataKey="institutional" name="法人" stroke="#4fc3f7" dot={false} />
          <Line type="monotone" dataKey="ma" name="均線" stroke="#26a69a" dot={false} />
          <Line type="monotone" dataKey="volume" name="成交量" stroke="#ffa726" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
