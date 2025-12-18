import React from 'react';

/**
 * Component Chart tái sử dụng
 * Hỗ trợ nhiều loại biểu đồ: bar, line, pie
 */
const Chart = ({
  data = [],
  type = 'bar', // 'bar' | 'line' | 'pie'
  height = '200px',
  color = 'blue',
  valueKey = 'value',
  labelKey = 'label',
  formatValue = (val) => val,
  title,
  subtitle,
  showLegend = false,
  className = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
        {title && <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>}
        <div className="flex items-center justify-center h-40 text-gray-500">
          <p>Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  const colorClasses = {
    blue: 'from-blue-200 to-blue-500',
    green: 'from-green-200 to-green-500',
    purple: 'from-purple-200 to-purple-500',
    orange: 'from-orange-200 to-orange-500',
    red: 'from-red-200 to-red-500',
    yellow: 'from-yellow-200 to-yellow-500',
    indigo: 'from-indigo-200 to-indigo-500',
    pink: 'from-pink-200 to-pink-500',
  };

  const colorClass = colorClasses[color] || colorClasses.blue;

  const maxValue = Math.max(...data.map((d) => {
    const val = d[valueKey] || d.value || d.total || d.count || 0;
    return typeof val === 'number' ? val : 0;
  }), 1);
  

  const renderBarChart = () => {
    // --- SỬA ĐOẠN NÀY ---
    // Chuyển props height (ví dụ '300px') thành số (300) để tính toán
    const containerHeight = parseInt(height) || 300;
    
    // Thiết lập padding - tăng paddingTop để giá trị không bị che
    const paddingTop = 60; // Tăng lên để có đủ không gian cho giá trị trên đầu cột
    const paddingBottom = 40;
    const paddingLeft = 80; // Tăng lên để có đủ không gian hiển thị số trên trục Y (ví dụ: 20.000 ₫)
    
    // Tính chiều cao thực của các cột bar dựa trên khung bao ngoài
    // Trừ đi padding trên dưới và một chút khoảng hở an toàn (-20)
    const chartHeight = containerHeight - paddingTop - paddingBottom - 20;
    
    // Tổng chiều cao khớp với container
    const totalHeight = containerHeight;
    
    // Tính các giá trị cho trục Y (chia thành 5 mức, BẮT ĐẦU TỪ 0)
    const yAxisSteps = 5;
    const yAxisMax = maxValue > 0 
      ? Math.max(Math.ceil(maxValue / 10) * 10, 10) 
      : 10;
    
    const yAxisInterval = yAxisMax / yAxisSteps;
    const yAxisValues = Array.from({ length: yAxisSteps + 1 }, (_, i) => 
      Math.round(yAxisMax - (i * yAxisInterval))
    );
    // Đảm bảo số 0 luôn có ở cuối
    yAxisValues[yAxisValues.length - 1] = 0;
    
    // Màu sắc cho từng cột
    const getBarColor = (item, idx) => {
      if (item.color) {
        const colorMap = {
          blue: 'from-blue-400 to-blue-600',
          green: 'from-green-400 to-green-600',
          orange: 'from-orange-400 to-orange-600',
          purple: 'from-purple-400 to-purple-600',
          red: 'from-red-400 to-red-600',
          yellow: 'from-yellow-400 to-yellow-600',
          pink: 'from-pink-400 to-pink-600',
          indigo: 'from-indigo-400 to-indigo-600',
        };
        return colorMap[item.color] || colorClass;
      }
      return colorClass;
    };
    
    return (
      <div className="w-full overflow-visible" style={{ height: `${totalHeight}px`, position: 'relative', minHeight: `${totalHeight}px` }}>
        <div className="flex gap-2 h-full w-full" style={{ width: '100%', maxWidth: '100%' }}>
          {/* Trục Y với các giá trị */}
          <div 
            className="flex flex-col justify-between flex-shrink-0" 
            style={{ 
              width: `${paddingLeft}px`, 
              paddingTop: `${paddingTop}px`, 
              paddingBottom: `${paddingBottom}px`,
              position: 'relative',
              flexShrink: 0,
              overflow: 'visible' // Đảm bảo số không bị che
            }}
          >
            {yAxisValues.map((val, idx) => {
              const isZero = val === 0;
              let yPos;
              if (isZero) {
                // Số 0 nằm ở đáy trục X (baseline của các cột)
                yPos = chartHeight;
              } else {
                // Các số khác
                yPos = ((yAxisMax - val) / yAxisMax) * chartHeight;
              }
              // ĐẨY TẤT CẢ CÁC SỐ LÊN TRÊN, kể cả số 0 - tăng lên để số 0 nằm sát trục OX
              const offsetUp = 30;
              return (
                <div 
                  key={idx} 
                  className="text-xs font-semibold text-gray-700 flex items-end justify-end pr-2 absolute"
                  style={{ 
                    top: `${paddingTop + yPos - offsetUp}px`,
                    transform: isZero ? 'translateY(0)' : 'translateY(-50%)',
                    width: `${paddingLeft}px`,
                    right: '0',
                    textAlign: 'right',
                    overflow: 'visible',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ overflow: 'visible', whiteSpace: 'nowrap' }}>{formatValue(val)}</span>
                </div>
              );
            })}
          </div>
          
          {/* Biểu đồ cột */}
          <div className="flex-1 flex flex-col relative h-full" style={{ minWidth: 0, width: 0, overflow: 'visible' }}>
            {/* Container cho các cột */}
            <div 
              className="flex items-end relative z-10" 
              style={{ 
                paddingTop: `${paddingTop}px`, 
                paddingBottom: `${paddingBottom}px`,
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                width: '100%',
                height: '100%',
                gap: '8px',
                boxSizing: 'border-box'
              }}
            >
              {data.map((item, idx) => {
                const rawValue = item[valueKey] ?? item.value ?? item.total ?? item.count ?? 0;
                const value = Number(rawValue) || 0;
                const label = item[labelKey] || item.label || item.period || item.month || item.date || item.name || `Item ${idx + 1}`;
                const heightPercent = yAxisMax > 0 ? (value / yAxisMax) * 100 : 0;
                const actualHeight = (heightPercent / 100) * chartHeight;
                const finalHeight = value === 0 || actualHeight === 0 ? 0 : Math.max(actualHeight, 2);
                const barColor = getBarColor(item, idx);
                
                return (
                  <div key={idx} className="flex flex-col items-center justify-end relative" style={{ 
                    height: '100%', 
                    position: 'relative',
                    flex: '1 1 0',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {/* Giá trị trên đầu cột */}
                    <div 
                      className="absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap z-30"
                      style={{ 
                        bottom: finalHeight > 0 
                          ? `${paddingBottom + finalHeight + 15}px` 
                          : `${paddingBottom + 10}px`,
                        top: 'auto',
                        maxWidth: '100%',
                        overflow: 'visible'
                      }}
                    >
                      <div className={`text-sm font-bold ${
                        value === 0 
                          ? 'text-gray-400' 
                          : 'text-gray-800'
                      }`}>
                        {formatValue(value)}
                      </div>
                    </div>
                    
                    {/* Cột */}
                    <div className="relative w-full flex flex-col items-center justify-end" style={{ 
                      height: `${chartHeight}px`, 
                      marginBottom: `${paddingBottom}px`,
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box'
                    }}>
                      {finalHeight > 0 ? (
                        <div
                          className={`w-full bg-gradient-to-t ${barColor} rounded-t-lg transition-all duration-300 hover:opacity-90 cursor-pointer shadow-lg hover:shadow-xl border-2 border-white relative`}
                          style={{ 
                            height: `${finalHeight}px`,
                            minHeight: '2px',
                            alignSelf: 'flex-end',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                          }}
                          title={`${label}: ${formatValue(value)}`}
                        >
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-t-lg transition-opacity"></div>
                        </div>
                      ) : (
                        <div
                          className="w-full bg-transparent"
                          style={{ 
                            height: '0px',
                            minHeight: '0px',
                            alignSelf: 'flex-end',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                          }}
                          title={`${label}: ${formatValue(value)}`}
                        >
                        </div>
                      )}
                    </div>
                    
                    {/* Nhãn dưới cột */}
                    <div className="absolute w-full flex-shrink-0" style={{ 
                      bottom: '0', 
                      height: `${paddingBottom}px`, 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'center', 
                      paddingTop: '8px',
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div className="text-xs font-semibold text-gray-700 text-center truncate w-full" title={label} style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-gray-500">
          <p>Chưa có dữ liệu</p>
        </div>
      );
    }

    const chartHeight = 250;
    const chartWidth = 100;
    const paddingTop = 40;
    const paddingBottom = 50;
    const paddingLeft = 60;
    const paddingRight = 20;
    const innerHeight = chartHeight - paddingTop - paddingBottom;
    const innerWidth = chartWidth - paddingLeft - paddingRight;

    // Tính các giá trị cho trục Y
    const yAxisSteps = 5;
    const yAxisMax = Math.ceil(maxValue / 10) * 10 || 10;
    const yAxisInterval = yAxisMax / yAxisSteps;
    const yAxisValues = Array.from({ length: yAxisSteps + 1 }, (_, i) => 
      Math.round(yAxisMax - (i * yAxisInterval))
    );

    // Tính toán các điểm
    const points = data.map((item, idx) => {
      const value = Number(item[valueKey] || item.value || item.total || item.count || 0);
      const x = data.length > 1 
        ? paddingLeft + (idx / (data.length - 1)) * innerWidth
        : paddingLeft + innerWidth / 2;
      const yPercent = yAxisMax > 0 ? (value / yAxisMax) * 100 : 0;
      const y = paddingTop + innerHeight - (yPercent / 100) * innerHeight;
      return { 
        x, 
        y, 
        value, 
        label: item[labelKey] || item.label || `Item ${idx + 1}`,
        xPercent: data.length > 1 ? (idx / (data.length - 1)) * 100 : 50
      };
    });

    // Tạo path cho đường line
    const createSmoothPath = (points) => {
      if (points.length < 2) return '';
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        if (next) {
          const cp1x = prev.x + (curr.x - prev.x) / 2;
          const cp1y = prev.y;
          const cp2x = curr.x - (next.x - curr.x) / 2;
          const cp2y = curr.y;
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        } else {
          const cp1x = prev.x + (curr.x - prev.x) / 2;
          const cp1y = prev.y;
          path += ` Q ${cp1x} ${cp1y}, ${curr.x} ${curr.y}`;
        }
      }
      return path;
    };

    const pathD = data.length > 2 
      ? createSmoothPath(points)
      : points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const areaPath = `${pathD} L ${paddingLeft + innerWidth} ${paddingTop + innerHeight} L ${paddingLeft} ${paddingTop + innerHeight} Z`;

    const colorMap = {
      blue: { stroke: '#3b82f6', fill: '#3b82f6', light: '#dbeafe' },
      green: { stroke: '#10b981', fill: '#10b981', light: '#d1fae5' },
      purple: { stroke: '#8b5cf6', fill: '#8b5cf6', light: '#e9d5ff' },
      orange: { stroke: '#f97316', fill: '#f97316', light: '#fed7aa' },
      red: { stroke: '#ef4444', fill: '#ef4444', light: '#fee2e2' },
      yellow: { stroke: '#eab308', fill: '#eab308', light: '#fef9c3' },
      indigo: { stroke: '#6366f1', fill: '#6366f1', light: '#e0e7ff' },
      pink: { stroke: '#ec4899', fill: '#ec4899', light: '#fce7f3' },
    };
    const colors = colorMap[color] || colorMap.blue;

    return (
      <div className="w-full" style={{ height: `${chartHeight}px` }}>
        <div className="relative h-full">
          <svg 
            className="w-full h-full" 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id={`gradient-line-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.fill} stopOpacity="0.3" />
                <stop offset="100%" stopColor={colors.fill} stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <path
              d={areaPath}
              fill={`url(#gradient-line-${color})`}
            />

            <path
              d={pathD}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point, idx) => (
              <g key={idx}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill={colors.stroke}
                  fillOpacity="0.2"
                  className="hover:fill-opacity-40 transition-opacity"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={colors.stroke}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-5 transition-all cursor-pointer"
                />
                <g className="opacity-0 hover:opacity-100 transition-opacity">
                  <rect
                    x={point.x - 20}
                    y={point.y - 30}
                    width="40"
                    height="20"
                    rx="4"
                    fill="#1f2937"
                    fillOpacity="0.9"
                  />
                  <text
                    x={point.x}
                    y={point.y - 15}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {formatValue(point.value)}
                  </text>
                </g>
              </g>
            ))}
          </svg>

          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between" 
               style={{ width: `${paddingLeft}px`, paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px` }}>
            {yAxisValues.map((val, idx) => (
              <div 
                key={idx} 
                className="text-xs font-semibold text-gray-700 flex items-center justify-end pr-2"
                style={{ height: `${innerHeight / yAxisSteps}px` }}
              >
                {formatValue(val)}
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex justify-between"
               style={{ 
                 height: `${paddingBottom}px`, 
                 paddingLeft: `${paddingLeft}px`, 
                 paddingRight: `${paddingRight}px` 
               }}>
            {data.map((item, idx) => {
              const label = item[labelKey] || item.label || `Item ${idx + 1}`;
              const xPercent = (idx / (data.length - 1 || 1)) * 100;
              return (
                <div
                  key={idx}
                  className="text-xs text-gray-600 font-medium text-center truncate"
                  style={{ 
                    width: `${100 / data.length}%`,
                    transform: idx === 0 ? 'translateX(0)' : idx === data.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                    textAlign: idx === 0 ? 'left' : idx === data.length - 1 ? 'right' : 'center'
                  }}
                  title={label}
                >
                  {label.length > 12 ? `${label.substring(0, 12)}...` : label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    let currentAngle = 0;
    const total = data.reduce((sum, item) => {
      const val = item[valueKey] || item.value || item.total || item.count || 0;
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);

    const colorMap = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f97316',
      red: '#ef4444',
      yellow: '#eab308',
      indigo: '#6366f1',
      pink: '#ec4899',
    };
    
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'indigo', 'pink'];
    
    // Calculate label positions for each segment
    const segments = data.map((item, idx) => {
      const value = item[valueKey] || item.value || item.total || item.count || 0;
      const percentage = total > 0 ? (value / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      
      const startAngle = currentAngle;
      const midAngle = currentAngle + angle / 2;
      currentAngle += angle;
      
      // Calculate position for label (middle of segment)
      const labelRadius = 38; // Distance from center - tăng lên để xa hơn
      const labelX = 50 + labelRadius * Math.cos((midAngle * Math.PI) / 180);
      const labelY = 50 + labelRadius * Math.sin((midAngle * Math.PI) / 180);
      
      return {
        value,
        percentage,
        angle,
        startAngle,
        midAngle,
        labelX,
        labelY,
        label: item[labelKey] || item.label || `Item ${idx + 1}`,
        color: colorMap[colors[idx % colors.length]],
      };
    });
    
    currentAngle = 0; // Reset for path drawing
    
    return (
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        <div className="relative w-80 h-80 lg:w-96 lg:h-96">
          <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
            {segments.map((segment, idx) => {
              const largeArc = segment.angle > 180 ? 1 : 0;
              
              const startAngle = currentAngle;
              const endAngle = currentAngle + segment.angle;
              
              const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
              
              const pathD = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
              
              currentAngle += segment.angle;
              
              return (
                <g key={idx}>
                  <path
                    d={pathD}
                    fill={segment.color}
                    opacity="0.8"
                  />
                  {/* Label inside pie chart - chỉ hiển thị số */}
                  {segment.percentage > 1 && (
                    <g>
                      <text
                        x={segment.labelX}
                        y={segment.labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="6"
                        fontWeight="bold"
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth="0.5"
                        transform={`rotate(${segment.midAngle + 90} ${segment.labelX} ${segment.labelY})`}
                      >
                        <tspan x={segment.labelX} fontSize="6.5" fontWeight="bold">{segment.value}</tspan>
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        {showLegend && (
          <div className="flex flex-col gap-2">
            {segments.map((segment, idx) => {
              return (
                <div key={idx} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{segment.label}</span>
                  <span className="text-sm font-semibold text-gray-900 ml-2">{segment.percentage.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm w-full ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="w-full overflow-visible" style={{ height, minHeight: height }}>
        {type === 'bar' && renderBarChart()}
        {type === 'line' && renderLineChart()}
        {type === 'pie' && renderPieChart()}
      </div>
    </div>
  );
};

export default Chart;

