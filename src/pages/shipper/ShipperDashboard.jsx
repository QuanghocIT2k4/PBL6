import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useNavigate, useLocation } from 'react-router-dom';
import ShipperLayout from '../../layouts/ShipperLayout';
import { 
  getPickingUpShipments, 
  getShipperHistory,
  pickupShipment,
  startShipping,
  completeShipment,
  failShipment,
  confirmPicked,
  startReturning,
  confirmReturned,
} from '../../services/shipper/shipperService';
import { useToast } from '../../context/ToastContext';
import { getOrderCode, getShipmentCode } from '../../utils/displayCodeUtils';

const ShipperDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  // Set active tab based on URL
  const [activeTab, setActiveTab] = useState(
    location.pathname === '/shipper/history' ? 'history' : 'picking-up'
  );
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  // ✅ Load từng batch 15 đơn cho lịch sử
  const historyPageSize = 15; // Load 15 đơn mỗi lần
  // State để track số đơn đã hiển thị trong tab history
  const [displayedHistoryCount, setDisplayedHistoryCount] = useState(15); // Hiển thị 15 đơn đầu tiên
  // State để tự động load tiếp khi còn đơn
  const [autoLoadMore, setAutoLoadMore] = useState(true);
  // State để lưu tất cả history shipments đã load (để append khi load thêm)
  const [allLoadedHistoryShipments, setAllLoadedHistoryShipments] = useState([]);
  // State để track page hiện tại đang load cho history
  const [historyPage, setHistoryPage] = useState(0);
  // Lưu trạng thái cục bộ cho đơn đang xử lý (PICKING/PICKED/SHIPPING) để tránh biến mất khi API không trả về
  const [processingLocal, setProcessingLocal] = useState([]);
  // ✅ Track các shipment đang được xử lý để disable button và hiển thị loading
  const [processingShipmentIds, setProcessingShipmentIds] = useState(new Set());

  // Update tab when URL changes
  useEffect(() => {
    if (location.pathname === '/shipper/history') {
      // Nếu đang ở tab processing, giữ nguyên và refresh data
      if (activeTab === 'processing') {
        mutateHistory();
      } else {
        setActiveTab('history');
      }
      // ✅ Reset về trang đầu tiên khi chuyển sang tab history
      setCurrentPage(0);
    } else {
      setActiveTab('picking-up');
      // ✅ Reset về trang đầu tiên khi chuyển sang tab picking-up
      setCurrentPage(0);
    }
  }, [location.pathname]); // ✅ Chỉ depend vào location.pathname để tránh vòng lặp

  // Fetch picking up shipments
  // ❌ TẮT AUTO-REFRESH - Theo yêu cầu tắt tự động vận chuyển
  const { data: pickingUpData, error: pickingUpError, isLoading: pickingUpLoading, mutate: mutatePickingUp } = useSWR(
    ['shipper-picking-up', currentPage],
    () => getPickingUpShipments({ page: currentPage, size: pageSize }),
    { 
      revalidateOnFocus: true, // ✅ Bật lại revalidate khi focus vào tab để shipper thấy đơn mới
      refreshInterval: 0, // Tắt auto refresh
      onError: (error) => {
        // Error handled silently
      },
      onSuccess: (data) => {
        // Success handled silently
      }
    }
  );

  // Fetch history - ✅ Load từng batch 15 đơn
  const { data: historyData, error: historyError, isLoading: historyLoading, mutate: mutateHistory } = useSWR(
    ['shipper-history', historyPage],
    () => getShipperHistory({ page: historyPage, size: historyPageSize }),
    { 
      revalidateOnFocus: activeTab === 'history' || activeTab === 'processing', // ✅ Bật revalidate khi ở tab history hoặc processing để realtime
      refreshInterval: 0, // Tắt auto refresh cho page cụ thể, sẽ dùng page 0 riêng
      dedupingInterval: 2000, // Tránh duplicate requests
      keepPreviousData: true, // ✅ Giữ data cũ khi load data mới để tránh flash
      revalidateIfStale: false // ✅ Không revalidate nếu data chưa stale
    }
  );

  // ✅ Fetch page 0 riêng để luôn có đơn mới nhất (realtime)
  const { data: latestHistoryData, mutate: mutateLatestHistory } = useSWR(
    activeTab === 'history' ? ['shipper-history-latest', 0] : null, // Chỉ fetch khi ở tab history
    () => getShipperHistory({ page: 0, size: historyPageSize }),
    { 
      revalidateOnFocus: true, // ✅ Bật revalidate khi focus vào tab
      refreshInterval: activeTab === 'history' ? 5000 : 0, // ✅ Auto-refresh mỗi 5 giây khi ở tab history để realtime
      dedupingInterval: 2000, // Tránh duplicate requests
      keepPreviousData: true, // ✅ Giữ data cũ khi load data mới để tránh flash
      revalidateIfStale: false // ✅ Không revalidate nếu data chưa stale
    }
  );

  // ✅ Reset khi chuyển tab hoặc khi vào trang lần đầu
  const [isHistoryInitialized, setIsHistoryInitialized] = useState(false);
  
  useEffect(() => {
    if (activeTab === 'history' && !isHistoryInitialized) {
      // ✅ Chỉ reset khi vào tab history lần đầu tiên, không reset khi đã có data
      if (allLoadedHistoryShipments.length === 0) {
        setHistoryPage(0);
        setDisplayedHistoryCount(15);
        setAllLoadedHistoryShipments([]);
        setAutoLoadMore(true); // Bật tự động load
      }
      setIsHistoryInitialized(true);
    } else if (activeTab !== 'history' && activeTab !== 'processing') {
      // ✅ Chỉ reset khi chuyển sang tab khác (không phải history hoặc processing)
      setIsHistoryInitialized(false);
      setAutoLoadMore(false); // Tắt khi chuyển tab khác
    }
  }, [activeTab, isHistoryInitialized, allLoadedHistoryShipments.length]);

  // ✅ Khi data mới load về từ page 0 (đơn mới nhất), merge vào đầu danh sách
  useEffect(() => {
    if (latestHistoryData?.success && latestHistoryData.data && activeTab === 'history') {
      const newShipments = Array.isArray(latestHistoryData.data?.content) 
        ? latestHistoryData.data.content 
        : Array.isArray(latestHistoryData.data) 
          ? latestHistoryData.data 
          : [];
      
      if (newShipments.length > 0) {
        // Merge đơn mới nhất vào đầu danh sách (loại bỏ duplicate theo ID)
        setAllLoadedHistoryShipments(prev => {
          const map = new Map();
          // Thêm các đơn mới nhất trước (ưu tiên)
          newShipments.forEach(s => {
            if (s?.id) map.set(s.id, s);
          });
          // Thêm các đơn cũ (không ghi đè nếu đã có)
          prev.forEach(s => {
            if (s?.id && !map.has(s.id)) {
              map.set(s.id, s);
            }
          });
          // Sắp xếp lại theo thời gian (mới nhất trước)
          return Array.from(map.values()).sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA;
          });
        });
      }
    }
  }, [latestHistoryData, activeTab]);

  // ✅ Khi data mới load về từ các page khác, append vào allLoadedHistoryShipments
  useEffect(() => {
    if (historyData?.success && historyData.data && isHistoryInitialized && historyPage > 0) {
      const newShipments = Array.isArray(historyData.data?.content) 
        ? historyData.data.content 
        : Array.isArray(historyData.data) 
          ? historyData.data 
          : [];
      
      // Append vào danh sách đã có (loại bỏ duplicate theo ID)
      setAllLoadedHistoryShipments(prev => {
        const map = new Map();
        // Thêm các đơn cũ
        prev.forEach(s => {
          if (s?.id) map.set(s.id, s);
        });
        // Thêm các đơn mới (ghi đè nếu trùng ID để lấy data mới nhất)
        newShipments.forEach(s => {
          if (s?.id) map.set(s.id, s);
        });
        return Array.from(map.values());
      });
    }
  }, [historyData, isHistoryInitialized, historyPage]);

  // ✅ Tự động load tiếp khi còn đơn
  useEffect(() => {
    if (activeTab === 'history' && isHistoryInitialized && autoLoadMore && !historyLoading && historyData?.success) {
      const totalHistoryElements = historyData?.data?.totalElements || 0;
      const currentLoadedCount = allLoadedHistoryShipments.length;
      const currentPageData = historyData?.data?.content || [];
      const currentPageSize = Array.isArray(currentPageData) ? currentPageData.length : 0;
      
      // Nếu còn đơn để load và chưa load hết
      if (totalHistoryElements > 0 && currentLoadedCount < totalHistoryElements) {
        // Nếu page hiện tại đã load đủ (có 15 đơn) và còn đơn để load, load page tiếp theo
        if (currentPageSize >= historyPageSize && currentLoadedCount < totalHistoryElements) {
          const nextPage = historyPage + 1;
          setHistoryPage(nextPage);
        }
      } else if (totalHistoryElements > 0 && currentLoadedCount >= totalHistoryElements) {
        // Đã load hết, tắt auto load và hiển thị tất cả
        setAutoLoadMore(false);
        setDisplayedHistoryCount(allLoadedHistoryShipments.length);
      } else if (totalHistoryElements === 0 && currentPageSize < historyPageSize) {
        // Không có totalElements nhưng page hiện tại < 15 đơn => đã hết
        setAutoLoadMore(false);
        setDisplayedHistoryCount(allLoadedHistoryShipments.length);
      }
    }
  }, [historyData, historyLoading, allLoadedHistoryShipments.length, activeTab, isHistoryInitialized, autoLoadMore, historyPage, historyPageSize]);

  // ✅ Đảm bảo luôn là array, xử lý các trường hợp edge case
  const allPickingUpShipments = pickingUpData?.success 
    ? (Array.isArray(pickingUpData.data?.content) 
        ? pickingUpData.data.content 
        : Array.isArray(pickingUpData.data?.data?.content)
          ? pickingUpData.data.data.content
          : Array.isArray(pickingUpData.data) 
            ? pickingUpData.data 
            : Array.isArray(pickingUpData.data?.data)
              ? pickingUpData.data.data
              : [])
    : [];
  
  // ✅ Filter: Chỉ hiển thị đơn chưa có shipper nhận (shipper = null hoặc chưa có shipperId)
  // Khi shipper khác nhận đơn, đơn đó sẽ tự động biến mất khỏi danh sách
  // Backend API nên đã filter, nhưng filter thêm ở frontend để chắc chắn
  const pickingUpShipments = allPickingUpShipments.filter(shipment => {
    // Chỉ hiển thị đơn chưa có shipper nhận (READY_TO_PICK và không có shipperId)
    return shipment.status === 'READY_TO_PICK' && !shipment.shipperId && !shipment.shipper;
  });
  
  
  // ✅ Dùng allLoadedHistoryShipments thay vì historyData trực tiếp
  const historyShipments = allLoadedHistoryShipments;
  // Lọc lịch sử: chỉ hiển thị đơn đã hoàn thành / thất bại / trả hàng
  const allFilteredHistoryShipments = historyShipments.filter((s) =>
    ['DELIVERED', 'FAILED', 'DELIVERED_FAIL', 'RETURNED'].includes(s?.status)
  );
  // ✅ Chỉ hiển thị displayedHistoryCount đơn đầu tiên
  const filteredHistoryShipments = allFilteredHistoryShipments.slice(0, displayedHistoryCount);
  
  // ✅ Kiểm tra xem còn đơn nào để load không
  const totalHistoryElements = historyData?.data?.totalElements || 0;
  // Hiển thị nút "Xem thêm" nếu:
  // 1. Còn đơn trong memory chưa hiển thị, HOẶC
  // 2. API còn đơn chưa load (totalElements > số đã load)
  const hasMoreHistory = displayedHistoryCount < allFilteredHistoryShipments.length || 
    (totalHistoryElements > 0 && allFilteredHistoryShipments.length < totalHistoryElements);
  
  // ✅ Hàm để load thêm 15 đơn tiếp theo
  const handleLoadMoreHistory = () => {
    const currentDisplayed = displayedHistoryCount;
    const nextDisplayed = currentDisplayed + 15;
    setDisplayedHistoryCount(nextDisplayed);
    
    // Nếu cần load thêm data từ API (chưa có đủ data để hiển thị)
    const neededCount = nextDisplayed;
    const currentLoadedCount = allFilteredHistoryShipments.length;
    
    // Kiểm tra xem có cần load thêm page không
    if (neededCount > currentLoadedCount) {
      // Tính toán page cần load tiếp theo (dựa trên số đơn đã load)
      const nextPage = Math.floor(currentLoadedCount / historyPageSize);
      if (nextPage >= historyPage) {
        setHistoryPage(nextPage + 1);
      }
    }
  };
  // Đơn đang xử lý (đã nhận hoặc đang giao / đang trả hàng)
  const processingFromHistory = historyShipments.filter((s) =>
    ['PICKING_UP', 'PICKING', 'PICKED', 'SHIPPING', 'RETURNING'].includes(s?.status)
  );
  // Merge processingLocal (ưu tiên status mới nhất)
  // ✅ Sắp xếp đơn mới nhất ở trên (theo createdAt hoặc updatedAt)
  const processingShipments = React.useMemo(() => {
    const map = new Map();
    processingFromHistory.forEach((s) => {
      map.set(s.id, s);
    });
    processingLocal.forEach((s) => {
      map.set(s.id, s);
    });
    const allProcessing = Array.from(map.values());
    
    // ✅ Sắp xếp theo thời gian mới nhất trước
    return allProcessing.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA; // Mới nhất trước
    });
  }, [processingFromHistory, processingLocal]);
  
  const totalPickingUpPages = pickingUpData?.data?.totalPages || 0;
  const totalHistoryPages = historyData?.data?.totalPages || 0;

  // Calculate statistics - ✅ Đếm status cho chuẩn từ tất cả shipments
  // ✅ Kết hợp TẤT CẢ shipments (pickingUpShipments, processingShipments, historyShipments) để đếm chính xác, loại bỏ duplicate
  const allShipmentsForStats = React.useMemo(() => {
    const shipmentMap = new Map();
    // Thêm pickingUpShipments
    if (Array.isArray(pickingUpShipments)) {
      pickingUpShipments.forEach(s => {
        if (s?.id) shipmentMap.set(s.id, s);
      });
    }
    // Thêm processingShipments (đơn đang xử lý)
    if (Array.isArray(processingShipments)) {
      processingShipments.forEach(s => {
        if (s?.id) shipmentMap.set(s.id, s); // Ghi đè nếu trùng ID để lấy data mới nhất
      });
    }
    // Thêm historyShipments (ghi đè nếu trùng ID để lấy data mới nhất)
    if (Array.isArray(historyShipments)) {
      historyShipments.forEach(s => {
        if (s?.id) shipmentMap.set(s.id, s);
      });
    }
    return Array.from(shipmentMap.values());
  }, [pickingUpShipments, processingShipments, historyShipments]);

  // ✅ Log tất cả đơn theo từng status (sau khi tất cả biến được định nghĩa)
  useEffect(() => {
    // Đếm đơn theo status từ pickingUpShipments
    const pickingUpByStatus = {};
    pickingUpShipments.forEach(s => {
      const status = s?.status || 'UNKNOWN';
      pickingUpByStatus[status] = (pickingUpByStatus[status] || 0) + 1;
    });

    // Đếm đơn theo status từ processingShipments
    const processingByStatus = {};
    processingShipments.forEach(s => {
      const status = s?.status || 'UNKNOWN';
      processingByStatus[status] = (processingByStatus[status] || 0) + 1;
    });

    // Đếm đơn theo status từ historyShipments
    const historyByStatus = {};
    historyShipments.forEach(s => {
      const status = s?.status || 'UNKNOWN';
      historyByStatus[status] = (historyByStatus[status] || 0) + 1;
    });

    // Tổng hợp tất cả đơn theo status
    const allShipments = [
      ...pickingUpShipments,
      ...processingShipments,
      ...historyShipments
    ];
    const allByStatus = {};
    allShipments.forEach(s => {
      const status = s?.status || 'UNKNOWN';
      allByStatus[status] = (allByStatus[status] || 0) + 1;
    });

  }, [pickingUpShipments, processingShipments, historyShipments, allFilteredHistoryShipments]);
  
  const stats = {
    // ✅ Đơn chờ nhận: đếm từ pickingUpShipments
    totalPickingUp: Array.isArray(pickingUpShipments) ? pickingUpShipments.length : 0,
    // ✅ Đơn đang nhận/giao: tất cả đơn đang xử lý (PICKING_UP, PICKING, PICKED, SHIPPING, RETURNING)
    totalProcessing: Array.isArray(processingShipments) ? processingShipments.length : 0,
    // Đang giao hàng: chỉ đếm đơn có status SHIPPING hoặc RETURNING
    totalShipping: Array.isArray(processingShipments)
      ? processingShipments.filter(s => s?.status === 'SHIPPING' || s?.status === 'RETURNING').length
      : 0,
    // ✅ Đếm từ tất cả shipments (đã loại bỏ duplicate) để có số chính xác
    totalDelivered: allShipmentsForStats.filter(s => 
      s?.status === 'DELIVERED' || s?.status === 'RETURNED'
    ).length,
    totalFailed: allShipmentsForStats.filter(s => 
      s?.status === 'FAILED' || s?.status === 'DELIVERED_FAIL'
    ).length,
    totalHistory: Array.isArray(filteredHistoryShipments) ? filteredHistoryShipments.length : 0,
  };

  // Handle pickup shipment (shipper nhận đơn)
  // ✅ Tối ưu: Optimistic update để UI phản hồi ngay
  const handlePickupShipment = async (shipment) => {
    const shipmentId = shipment?.id || shipment;

    // ✅ OPTIMISTIC UPDATE: Cập nhật UI ngay lập tức
    const baseShipment =
      typeof shipment === 'object' && shipment
        ? shipment
        : { id: shipmentId, status: 'PICKING_UP' };
    
    // ✅ Đưa đơn vừa nhận sang danh sách đang nhận/giao (PICKING_UP) ngay
    setProcessingLocal((prev) => {
      const next = prev.filter((s) => s.id !== shipmentId);
      next.push({ ...baseShipment, status: 'PICKING_UP' });
      return next;
    });
    mutatePickingUp();
    mutateHistory();
    mutateLatestHistory();
    
    // ✅ Gọi API trong background
    try {
      const result = await pickupShipment(shipmentId);
      if (result.success) {
        showToast('Nhận đơn hàng thành công!', 'success');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      } else {
        // ✅ Rollback nếu API fail
        setProcessingLocal((prev) => prev.filter((s) => s.id !== shipmentId));
        showToast(result.error || 'Không thể nhận đơn hàng', 'error');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      }
    } catch (error) {
      // ✅ Rollback nếu có lỗi
      setProcessingLocal((prev) => prev.filter((s) => s.id !== shipmentId));
      showToast('Có lỗi xảy ra khi nhận đơn hàng', 'error');
      mutatePickingUp();
      mutateHistory();
      mutateLatestHistory();
    }
  };

  // Handle start shipping
  // ✅ Tối ưu: Optimistic update với loading state
  const handleStartShipping = async (shipment) => {
    // ✅ Xử lý cả trường hợp nhận shipment object hoặc shipmentId
    const shipmentObj = typeof shipment === 'object' ? shipment : { id: shipment };
    const shipmentId = shipmentObj.id || shipment;
    
    if (shipmentObj?.isReturnShipment) {
      showToast('Đơn trả hàng về shop: dùng nút "Bắt đầu trả hàng", không dùng nút giao hàng thường.', 'warning');
      return;
    }
    
    // ✅ Set loading state
    setProcessingShipmentIds(prev => new Set(prev).add(shipmentId));
    
    // ✅ Delay nhỏ để UI mượt mà hơn (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ✅ OPTIMISTIC UPDATE: Cập nhật UI ngay lập tức
    const originalProcessingLocal = [...processingLocal];
    setProcessingLocal((prev) => {
      const next = prev.filter((s) => s.id !== shipmentId);
      next.push({ ...shipmentObj, status: 'SHIPPING' });
      return next;
    });
    mutatePickingUp();
    mutateHistory();
    mutateLatestHistory();
    
    // ✅ Gọi API trong background
    try {
      const result = await startShipping(shipmentId);
      if (result.success) {
        showToast('Bắt đầu giao hàng thành công!', 'success');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      } else {
        // ✅ Rollback nếu API fail
        setProcessingLocal(originalProcessingLocal);
        showToast(result.error || 'Không thể bắt đầu giao hàng', 'error');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      }
    } catch (error) {
      // ✅ Rollback nếu có lỗi
      setProcessingLocal(originalProcessingLocal);
      showToast('Có lỗi xảy ra khi bắt đầu giao hàng', 'error');
      mutatePickingUp();
      mutateHistory();
      mutateLatestHistory();
    } finally {
      // ✅ Remove loading state
      setProcessingShipmentIds(prev => {
        const next = new Set(prev);
        next.delete(shipmentId);
        return next;
      });
    }
  };

  // Handle start returning (for return shipments)
  // ✅ Tối ưu: Optimistic update với loading state
  const handleStartReturning = async (shipment) => {
    const shipmentId = shipment.id;
    
    // ✅ Set loading state
    setProcessingShipmentIds(prev => new Set(prev).add(shipmentId));
    
    // ✅ Delay nhỏ để UI mượt mà hơn (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ✅ OPTIMISTIC UPDATE: Cập nhật UI ngay lập tức
    const originalProcessingLocal = [...processingLocal];
    setProcessingLocal((prev) => {
      const next = prev.filter((s) => s.id !== shipmentId);
      next.push({ ...shipment, status: 'RETURNING' });
      return next;
    });
    mutatePickingUp();
    mutateHistory();
    mutateLatestHistory();
    
    // ✅ Gọi API trong background
    try {
      const result = await startReturning(shipmentId);
      if (result.success) {
        showToast(result.message || 'Bắt đầu trả hàng thành công!', 'success');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      } else {
        // ✅ Rollback nếu API fail
        setProcessingLocal(originalProcessingLocal);
        showToast(result.error || 'Không thể bắt đầu trả hàng', 'error');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      }
    } catch (error) {
      // ✅ Rollback nếu có lỗi
      setProcessingLocal(originalProcessingLocal);
      showToast('Có lỗi xảy ra khi bắt đầu trả hàng', 'error');
      mutatePickingUp();
      mutateHistory();
      mutateLatestHistory();
    } finally {
      // ✅ Remove loading state
      setProcessingShipmentIds(prev => {
        const next = new Set(prev);
        next.delete(shipmentId);
        return next;
      });
    }
  };

  // Handle complete shipment
  // ✅ Tối ưu: Optimistic update với loading state
  const handleCompleteShipment = async (shipment) => {
    // ✅ Xử lý cả trường hợp nhận shipment object hoặc shipmentId
    const shipmentObj = typeof shipment === 'object' ? shipment : { id: shipment };
    const shipmentId = shipmentObj.id || shipment;
    
    if (shipmentObj?.isReturnShipment) {
      showToast('Đơn trả hàng: dùng nút "Xác nhận đã trả hàng", không dùng nút hoàn thành giao hàng.', 'warning');
      return;
    }
    
    // ✅ Set loading state
    setProcessingShipmentIds(prev => new Set(prev).add(shipmentId));
    
    // ✅ Delay nhỏ để UI mượt mà hơn (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ✅ OPTIMISTIC UPDATE: Remove shipment khỏi UI ngay (vì đã hoàn thành)
    const originalProcessingLocal = [...processingLocal];
    setProcessingLocal((prev) => prev.filter((s) => s.id !== shipmentId));
    mutatePickingUp();
    mutateHistory();
    mutateLatestHistory();
    
    // ✅ Gọi API trong background
    try {
      const result = await completeShipment(shipmentId);
      if (result.success) {
        showToast('Hoàn thành giao hàng thành công!', 'success');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      } else {
        // ✅ Rollback nếu API fail
        setProcessingLocal(originalProcessingLocal);
        showToast(result.error || 'Không thể hoàn thành giao hàng', 'error');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      }
    } catch (error) {
      // ✅ Rollback nếu có lỗi
      setProcessingLocal(originalProcessingLocal);
      showToast('Có lỗi xảy ra khi hoàn thành giao hàng', 'error');
      mutatePickingUp();
      mutateHistory();
      mutateLatestHistory();
    } finally {
      // ✅ Remove loading state
      setProcessingShipmentIds(prev => {
        const next = new Set(prev);
        next.delete(shipmentId);
        return next;
      });
    }
  };

  // Handle confirm returned (for return shipments)
  // ✅ Tối ưu: Optimistic update với loading state và force refresh history
  const handleConfirmReturned = async (shipment) => {
    const shipmentId = shipment.id;
    
    // ✅ Set loading state
    setProcessingShipmentIds(prev => new Set(prev).add(shipmentId));
    
    // ✅ Delay nhỏ để UI mượt mà hơn (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ✅ OPTIMISTIC UPDATE: Remove shipment khỏi UI ngay
    const originalProcessingLocal = [...processingLocal];
    setProcessingLocal((prev) => prev.filter((s) => s.id !== shipmentId));
    mutatePickingUp();
    
    // ✅ Gọi API trong background
    try {
      const result = await confirmReturned(shipmentId);
      if (result.success) {
        showToast(result.message || 'Đã xác nhận trả hàng thành công!', 'success');
        
        // ✅ FORCE REFRESH HISTORY NGAY LẬP TỨC - Reset và reload từ đầu
        setHistoryPage(0);
        setAllLoadedHistoryShipments([]);
        setDisplayedHistoryCount(15);
        
        // ✅ Force revalidate tất cả history queries
        await Promise.all([
          mutateHistory({ revalidate: true }),
          mutateLatestHistory({ revalidate: true }),
          mutatePickingUp({ revalidate: true })
        ]);
        
        // ✅ Nếu đang ở tab history, chuyển sang tab history để thấy đơn mới
        if (activeTab !== 'history') {
          setActiveTab('history');
          navigate('/shipper/history');
        }
      } else {
        // ✅ Rollback nếu API fail
        setProcessingLocal(originalProcessingLocal);
        showToast(result.error || 'Không thể xác nhận trả hàng', 'error');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      }
    } catch (error) {
      // ✅ Rollback nếu có lỗi
      setProcessingLocal(originalProcessingLocal);
      showToast('Có lỗi xảy ra khi xác nhận trả hàng', 'error');
      mutatePickingUp();
      mutateHistory();
      mutateLatestHistory();
    } finally {
      // ✅ Remove loading state
      setProcessingShipmentIds(prev => {
        const next = new Set(prev);
        next.delete(shipmentId);
        return next;
      });
    }
  };

  // Handle fail shipment
  // ✅ Tối ưu: Optimistic update với loading state
  const handleFailShipment = async (shipment) => {
    // ✅ Xử lý cả trường hợp nhận shipment object hoặc shipmentId
    const shipmentObj = typeof shipment === 'object' ? shipment : { id: shipment };
    const shipmentId = shipmentObj.id || shipment;
    
    if (shipmentObj?.isReturnShipment) {
      showToast('Đơn trả hàng: không dùng nút "Giao thất bại" của đơn thường.', 'warning');
      return;
    }
    const reason = window.prompt('Nhập lý do giao hàng thất bại:');
    if (!reason) return;
    
    // ✅ Set loading state
    setProcessingShipmentIds(prev => new Set(prev).add(shipmentId));
    
    // ✅ Delay nhỏ để UI mượt mà hơn (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ✅ OPTIMISTIC UPDATE: Remove shipment khỏi UI ngay (vì đã fail)
    const originalProcessingLocal = [...processingLocal];
    setProcessingLocal((prev) => prev.filter((s) => s.id !== shipmentId));
    mutatePickingUp();
    mutateHistory();
    mutateLatestHistory();
    
    // ✅ Gọi API trong background
    try {
      const result = await failShipment(shipmentId, reason);
      if (result.success) {
        showToast('Đã đánh dấu giao hàng thất bại', 'success');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      } else {
        // ✅ Rollback nếu API fail
        setProcessingLocal(originalProcessingLocal);
        showToast(result.error || 'Không thể đánh dấu giao hàng thất bại', 'error');
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      }
    } catch (error) {
      // ✅ Rollback nếu có lỗi
      setProcessingLocal(originalProcessingLocal);
      showToast('Có lỗi xảy ra khi đánh dấu giao hàng thất bại', 'error');
      mutatePickingUp();
      mutateHistory();
      mutateLatestHistory();
    } finally {
      // ✅ Remove loading state
      setProcessingShipmentIds(prev => {
        const next = new Set(prev);
        next.delete(shipmentId);
        return next;
      });
    }
  };

  // Handle confirm picked (đã lấy xong hàng)
  // ⚠️ QUAN TRỌNG: Khi confirm picked, shipment phải chuyển status thành PICKED
  // KHÔNG được remove khỏi processingLocal, vì shipper còn cần click "Bắt đầu giao hàng"
  // ✅ Tối ưu: Optimistic update với loading state
  const handleConfirmPicked = async (shipment) => {
    const shipmentId = shipment.id;
    
    // ✅ Set loading state
    setProcessingShipmentIds(prev => new Set(prev).add(shipmentId));
    
    // ✅ Delay nhỏ để UI mượt mà hơn (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ✅ OPTIMISTIC UPDATE: Update status thành PICKED ngay (KHÔNG remove)
    const originalProcessingLocal = [...processingLocal];
    
    // ✅ Update status thành PICKED (vẫn giữ trong processingLocal)
    setProcessingLocal((prev) => {
      const next = prev.filter((s) => s.id !== shipmentId);
      next.push({ ...shipment, status: 'PICKED' });
      return next;
    });
    
    // ✅ Refresh data ngay lập tức (không đợi API response)
    mutatePickingUp();
    mutateHistory();
    mutateLatestHistory();
    
    // ✅ Gọi API trong background
    try {
      const result = await confirmPicked(shipmentId);
      if (result.success) {
        showToast('Đã xác nhận lấy hàng thành công!', 'success');
        // ✅ Refresh lại để đảm bảo data đồng bộ
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      } else {
        // ✅ Rollback nếu API fail
        setProcessingLocal(originalProcessingLocal);
        showToast(result.error || 'Không thể xác nhận lấy hàng', 'error');
        // ✅ Refresh lại để lấy data đúng
        mutatePickingUp();
        mutateHistory();
        mutateLatestHistory();
      }
    } catch (error) {
      // ✅ Rollback nếu có lỗi
      setProcessingLocal(originalProcessingLocal);
      showToast('Có lỗi xảy ra khi xác nhận lấy hàng', 'error');
      // ✅ Refresh lại để lấy data đúng
      mutatePickingUp();
      mutateHistory();
      mutateLatestHistory();
    } finally {
      // ✅ Remove loading state
      setProcessingShipmentIds(prev => {
        const next = new Set(prev);
        next.delete(shipmentId);
        return next;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatAddressDisplay = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.homeAddress,
      addr.ward,
      addr.province
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    return addr.fullAddress || addr.address || 'N/A';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'PICKING_UP': { text: 'Đang nhận hàng', color: 'bg-yellow-100 text-yellow-800' },
      'PICKING': { text: 'Đang lấy hàng', color: 'bg-amber-100 text-amber-800' },
      'PICKED': { text: 'Đã lấy hàng', color: 'bg-blue-100 text-blue-800' },
      'SHIPPING': { text: 'Đang giao hàng', color: 'bg-blue-100 text-blue-800' },
      'RETURNING': { text: 'Đang trả hàng về shop', color: 'bg-purple-100 text-purple-800' },
      'DELIVERED': { text: 'Đã giao', color: 'bg-green-100 text-green-800' },
      'FAILED': { text: 'Giao thất bại', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <ShipperLayout>
      <div>
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-200 to-emerald-200 rounded-2xl p-6 mb-6">
          <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-4xl">🚚</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Dashboard Shipper</h1>
                  <p className="text-gray-600 text-base mt-1">Quản lý đơn hàng và giao hàng</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đơn chờ nhận</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.totalPickingUp}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đơn đang nhận/giao</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalProcessing}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚚</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đã giao thành công</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalDelivered}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Giao thất bại</p>
                <p className="text-3xl font-bold text-red-600">{stats.totalFailed}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => {
                  setActiveTab('picking-up');
                  setCurrentPage(0); // ✅ Reset về trang đầu tiên
                  navigate('/shipper');
                }}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'picking-up'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Đơn chờ nhận ({pickingUpShipments.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('processing');
                  setCurrentPage(0); // ✅ Reset về trang đầu tiên
                  // ✅ Refresh data khi chuyển sang tab processing để có realtime
                  mutateHistory();
                  navigate('/shipper/history');
                }}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'processing'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Đơn đang nhận/giao ({processingShipments.length})
              </button>
              <button
                onClick={() => {
                  // ✅ Chỉ set tab, không reset page để tránh reload không cần thiết
                  setActiveTab('history');
                  navigate('/shipper/history');
                }}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Lịch sử giao hàng
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'picking-up' ? (
              <>
                {pickingUpLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : pickingUpError ? (
                  <div className="text-center py-12 text-red-600">
                    <p>Không thể tải danh sách đơn chờ nhận</p>
                  </div>
                ) : pickingUpShipments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">📦</p>
                    <p>Không có đơn hàng nào đang chờ nhận</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pickingUpShipments.map((shipment) => {
                      // ✅ Map đúng các field từ response
                      const orderId = shipment.order?.id || shipment.orderId || shipment.id;
                      const orderNumber = shipment.order?.orderNumber || shipment.orderNumber;
                      const totalPrice = shipment.order?.totalPrice || shipment.totalPrice;
                      const paymentMethod = shipment.order?.paymentMethod || shipment.paymentMethod;
                      const storeName = shipment.store?.name || shipment.storeName;
                      const fromAddress = shipment.fromAddress || shipment.shopAddress;
                      const toAddress = shipment.toAddress || shipment.address;
                      // Đơn trả hàng (buyer → shop)
                      const isReturnShipment =
                        shipment.isReturnShipment === true ||
                        shipment.returnShipment === true ||
                        shipment.type === 'RETURN' ||
                        // fallback: địa chỉ nhận chính là store -> khả năng cao là đơn trả hàng
                        (!!toAddress &&
                          !!storeName &&
                          (toAddress.storeId === shipment.store?.id ||
                            toAddress.suggestedName === storeName));

                      // ✅ Format mã đơn hàng đẹp hơn
                      const displayOrderCode = orderNumber || getOrderCode(orderId);
                      const displayShipmentCode = getShipmentCode(shipment.id);
                      
                      // ✅ Format địa chỉ
                      const formatAddress = (addr) => {
                        if (!addr) return 'N/A';
                        if (typeof addr === 'string') return addr;
                        const parts = [
                          addr.homeAddress,
                          addr.ward,
                          addr.province
                        ].filter(Boolean);
                        return parts.length > 0 ? parts.join(', ') : 'N/A';
                      };
                      
                      return (
                      <div
                        key={shipment.id || orderId}
                        className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-teal-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md ${
                                  isReturnShipment
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                    : 'bg-gradient-to-br from-teal-500 to-emerald-500'
                                }`}
                              >
                                <span className="text-2xl">{isReturnShipment ? '🔁' : '📦'}</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-xl text-gray-900">
                                  {displayOrderCode}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {storeName && `🏪 ${storeName}`}
                                  {shipment.expectedDeliveryDate && ` • Giao trước: ${new Date(shipment.expectedDeliveryDate).toLocaleDateString('vi-VN')}`}
                                </p>
                                {isReturnShipment && (
                                  <p className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                    ĐƠN TRẢ HÀNG VỀ SHOP
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  Mã vận đơn: {displayShipmentCode}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {/* Địa chỉ lấy hàng / shop (nơi gửi) */}
                          {fromAddress && (
                            <div className="bg-purple-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                {isReturnShipment ? '📍 Địa chỉ lấy hàng (khách trả)' : '🏪 Địa chỉ shop (nơi gửi)'}
                              </p>
                              <p className="text-sm text-gray-700 font-medium">
                                {fromAddress.suggestedName || 'Văn phòng'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatAddress(fromAddress)}
                              </p>
                            </div>
                          )}

                          {/* Delivery Address / Địa chỉ nhận đơn */}
                          {toAddress && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                {isReturnShipment ? '🏪 Địa chỉ nhận đơn (shop)' : '📍 Địa chỉ giao hàng'}
                              </p>
                              <p className="text-sm text-gray-700 font-medium">
                                {toAddress.suggestedName || 'Khách hàng'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatAddress(toAddress)}
                              </p>
                            </div>
                          )}

                          {totalPrice && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">💰 Tổng giá trị</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(parseFloat(totalPrice))}
                              </p>
                              {paymentMethod && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Thanh toán: {paymentMethod === 'COD' ? 'Tiền mặt' : paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : paymentMethod}
                                </p>
                              )}
                            </div>
                          )}

                          {shipment.shippingFee && (
                            <div className="bg-green-50 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">🚚 Phí vận chuyển</p>
                              <p className="text-xl font-bold text-green-600">
                                {formatCurrency(shipment.shippingFee)}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                          {shipment.status === 'READY_TO_PICK' && (
                            <button
                              onClick={() => handlePickupShipment(shipment)}
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                              <span>✅</span>
                              <span>Nhận đơn</span>
                            </button>
                          )}
                          {shipment.status === 'PICKING_UP' && shipment.shipperId && (
                            <button
                              onClick={() => handleStartShipping(shipment)}
                              disabled={processingShipmentIds.has(shipment.id)}
                              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingShipmentIds.has(shipment.id) ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  <span>Đang xử lý...</span>
                                </>
                              ) : (
                                <>
                                  <span>🚛</span>
                                  <span>Bắt đầu giao hàng</span>
                                </>
                              )}
                            </button>
                          )}
                          {shipment.status === 'SHIPPING' && (
                            <>
                              <button
                                onClick={() => handleCompleteShipment(shipment)}
                                disabled={processingShipmentIds.has(shipment.id)}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingShipmentIds.has(shipment.id) ? (
                                  <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Đang xử lý...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>✅</span>
                                    <span>Hoàn thành</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleFailShipment(shipment)}
                                disabled={processingShipmentIds.has(shipment.id)}
                                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingShipmentIds.has(shipment.id) ? (
                                  <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Đang xử lý...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>❌</span>
                                    <span>Giao thất bại</span>
                                  </>
                                )}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => navigate(`/shipper/shipments/${shipment.id}`)}
                            className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-teal-400 font-medium transition-all flex items-center gap-2"
                          >
                            <span>📋</span>
                            <span>Chi tiết</span>
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPickingUpPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Trang <span className="font-medium">{currentPage + 1}</span> / <span className="font-medium">{totalPickingUpPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        ← Trước
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPickingUpPages - 1, p + 1))}
                        disabled={currentPage >= totalPickingUpPages - 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : activeTab === 'processing' ? (
              <>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : historyError ? (
                  <div className="text-center py-12 text-red-600">
                    <p>Không thể tải danh sách đơn đang xử lý</p>
                  </div>
                ) : processingShipments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">🚚</p>
                    <p>Không có đơn đang nhận/giao</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {processingShipments.map((shipment) => {
                      const orderId = shipment.order?.id || shipment.orderId || shipment.id;
                      const orderNumber = shipment.order?.orderNumber || shipment.orderNumber;
                      const totalPrice = shipment.order?.totalPrice || shipment.totalPrice;
                      const storeName = shipment.store?.name || shipment.storeName;
                      const fromAddress = shipment.fromAddress || shipment.shopAddress;
                      const toAddress = shipment.toAddress || shipment.address;

                      const displayOrderCode = orderNumber || getOrderCode(orderId);
                      const displayShipmentCode = getShipmentCode(shipment.id);

                      const formatAddress = (addr) => {
                        if (!addr) return 'N/A';
                        if (typeof addr === 'string') return addr;
                        const parts = [
                          addr.homeAddress,
                          addr.ward,
                          addr.province
                        ].filter(Boolean);
                        return parts.length > 0 ? parts.join(', ') : 'N/A';
                      };

                      const isReturnShipment =
                        shipment.isReturnShipment === true ||
                        shipment.returnShipment === true ||
                        shipment.type === 'RETURN' ||
                        (!!toAddress &&
                          !!storeName &&
                          (toAddress.storeId === shipment.store?.id ||
                            toAddress.suggestedName === storeName ||
                            toAddress.name === storeName));

                      return (
                        <div
                          key={shipment.id || orderId}
                          className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-teal-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md ${
                                    isReturnShipment
                                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                      : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                                  }`}
                                >
                                  <span className="text-2xl">{isReturnShipment ? '🔁' : '🚚'}</span>
                                </div>
                                <div>
                                  <h3 className="font-bold text-xl text-gray-900">
                                    {displayOrderCode}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {storeName && `🏪 ${storeName}`}
                                  </p>
                                  {isReturnShipment && (
                                    <p className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                      ĐƠN TRẢ HÀNG VỀ SHOP
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    Mã vận đơn: {displayShipmentCode}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div>
                              {shipment.status && getStatusBadge(shipment.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {fromAddress && (
                              <div className="bg-purple-50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                  {isReturnShipment ? '📍 Địa chỉ lấy hàng (khách trả)' : '📍 Địa chỉ nhận hàng'}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {formatAddress(fromAddress)}
                                </p>
                              </div>
                            )}

                            {toAddress && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                  {isReturnShipment ? '🏪 Địa chỉ nhận đơn (shop)' : '📍 Địa chỉ nhận hàng'}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {formatAddress(toAddress)}
                                </p>
                              </div>
                            )}

                            {totalPrice && (
                              <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">💰 Tổng giá trị</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {formatCurrency(totalPrice)}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                            {isReturnShipment ? (
                              <>
                                {['PICKING_UP', 'PICKING'].includes(shipment.status) && (
                                  <button
                                    onClick={() => handleConfirmPicked(shipment)}
                                    disabled={processingShipmentIds.has(shipment.id)}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {processingShipmentIds.has(shipment.id) ? (
                                      <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Đang xử lý...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>📦</span>
                                        <span>Đã lấy hàng (trả)</span>
                                      </>
                                    )}
                                  </button>
                                )}
                                {shipment.status === 'PICKED' && (
                                  <button
                                    onClick={() => handleStartReturning(shipment)}
                                    disabled={processingShipmentIds.has(shipment.id)}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {processingShipmentIds.has(shipment.id) ? (
                                      <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Đang xử lý...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>🔁</span>
                                        <span>Bắt đầu trả hàng</span>
                                      </>
                                    )}
                                  </button>
                                )}
                                {shipment.status === 'RETURNING' && (
                                  <button
                                    onClick={() => handleConfirmReturned(shipment)}
                                    disabled={processingShipmentIds.has(shipment.id)}
                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {processingShipmentIds.has(shipment.id) ? (
                                      <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Đang xử lý...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>✅</span>
                                        <span>Xác nhận đã trả hàng</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {['PICKING_UP', 'PICKING'].includes(shipment.status) && (
                                  <button
                                    onClick={() => handleConfirmPicked(shipment)}
                                    disabled={processingShipmentIds.has(shipment.id)}
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-xl hover:from-indigo-700 hover:to-blue-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {processingShipmentIds.has(shipment.id) ? (
                                      <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Đang xử lý...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>📦</span>
                                        <span>Đã lấy hàng</span>
                                      </>
                                    )}
                                  </button>
                                )}
                                {shipment.status === 'PICKED' && (
                                  <button
                                    onClick={() => handleStartShipping(shipment)}
                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                  >
                                    <span>🚛</span>
                                    <span>Bắt đầu giao hàng</span>
                                  </button>
                                )}
                                {shipment.status === 'SHIPPING' && (
                                  <>
                                    <button
                                      onClick={() => handleCompleteShipment(shipment)}
                                      disabled={processingShipmentIds.has(shipment.id)}
                                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processingShipmentIds.has(shipment.id) ? (
                                        <>
                                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                          <span>Đang xử lý...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>✅</span>
                                          <span>Hoàn thành</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleFailShipment(shipment)}
                                      disabled={processingShipmentIds.has(shipment.id)}
                                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processingShipmentIds.has(shipment.id) ? (
                                        <>
                                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                          <span>Đang xử lý...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>❌</span>
                                          <span>Giao thất bại</span>
                                        </>
                                      )}
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => navigate(`/shipper/shipments/${shipment.id}`)}
                              className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-teal-400 font-medium transition-all flex items-center gap-2"
                            >
                              <span>📋</span>
                              <span>Chi tiết</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* ✅ Chỉ hiển thị loading khi chưa có data, không hiển thị khi đã có data (tránh flash) */}
                {historyLoading && filteredHistoryShipments.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : historyError && filteredHistoryShipments.length === 0 ? (
                  <div className="text-center py-12 text-red-600">
                    <p>Không thể tải lịch sử giao hàng</p>
                  </div>
                ) : filteredHistoryShipments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">📋</p>
                    <p>Chưa có lịch sử giao hàng</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHistoryShipments.map((shipment) => {
                      const orderId = shipment.order?.id || shipment.orderId || shipment.id;
                      const orderNumber = shipment.order?.orderNumber || shipment.orderNumber;
                      const displayOrderCode = orderNumber || getOrderCode(orderId);
                      const displayShipmentCode = getShipmentCode(shipment.id);
                      const deliveryAddress = shipment.address || shipment.toAddress;
                      const totalPrice = shipment.totalPrice || shipment.order?.totalPrice;
                      const storeName = shipment.store?.name || shipment.storeName;
                      const isReturnShipment =
                        shipment.isReturnShipment === true ||
                        shipment.returnShipment === true ||
                        shipment.type === 'RETURN' ||
                        (!!deliveryAddress &&
                          !!storeName &&
                          (deliveryAddress.storeId === shipment.store?.id ||
                            deliveryAddress.suggestedName === storeName ||
                            deliveryAddress.name === storeName));
                      
                      return (
                        <div
                          key={shipment.id || orderId}
                          className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-teal-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md ${
                                    shipment.status === 'DELIVERED' || shipment.status === 'RETURNED'
                                      ? isReturnShipment
                                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                        : 'bg-gradient-to-br from-green-500 to-emerald-500'
                                      : shipment.status === 'FAILED' || shipment.status === 'DELIVERED_FAIL'
                                      ? 'bg-gradient-to-br from-red-500 to-red-600'
                                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                  }`}
                                >
                                  <span className="text-2xl">
                                    {shipment.status === 'DELIVERED' || shipment.status === 'RETURNED'
                                      ? isReturnShipment ? '🔁' : '✅'
                                      : shipment.status === 'FAILED' || shipment.status === 'DELIVERED_FAIL'
                                      ? '❌'
                                      : '📦'}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-bold text-xl text-gray-900">
                                    {displayOrderCode}
                                  </h3>
                                  {(shipment.createdAt || shipment.order?.createdAt) && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      {formatDate(shipment.createdAt || shipment.order?.createdAt)}
                                    </p>
                                  )}
                                  {isReturnShipment && storeName && (
                                    <p className="text-sm text-gray-500">
                                      🏪 {storeName} · Đơn trả hàng về shop
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Mã vận đơn: {displayShipmentCode}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {deliveryAddress && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                  {isReturnShipment ? '🏪 Địa chỉ nhận đơn (shop)' : '📍 Địa chỉ nhận hàng'}
                                </p>
                                {(deliveryAddress.fullName || deliveryAddress.name) && (
                                  <p className="text-sm text-gray-700 font-medium">
                                    {deliveryAddress.fullName || deliveryAddress.name}
                                  </p>
                                )}
                                {deliveryAddress.phone && (
                                  <p className="text-sm text-gray-600">
                                    {deliveryAddress.phone}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600 mt-1">
                                  {formatAddressDisplay(deliveryAddress)}
                                </p>
                              </div>
                            )}

                            {totalPrice && (
                              <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">💰 Tổng giá trị</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {formatCurrency(totalPrice)}
                                </p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => navigate(`/shipper/shipments/${shipment.id}`)}
                            className="mt-4 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-teal-400 font-medium transition-all flex items-center gap-2"
                          >
                            <span>📋</span>
                            <span>Xem chi tiết</span>
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Nút Xem thêm */}
                    {hasMoreHistory && (
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={handleLoadMoreHistory}
                          disabled={historyLoading}
                          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-lg shadow-md hover:from-teal-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {historyLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Đang tải...</span>
                            </>
                          ) : (
                            <>
                              <span>Xem thêm</span>
                              <span className="text-sm">({allFilteredHistoryShipments.length - displayedHistoryCount} đơn còn lại)</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ShipperLayout>
  );
};

export default ShipperDashboard;

