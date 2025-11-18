import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoresByOwnerId } from '../services/common/storeService';
import { useAuth } from './AuthContext';

const StoreContext = createContext();

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  const { user } = useAuth();
  const [userStores, setUserStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserStores();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchUserStores = async () => {
    try {
      setLoading(true);
      
      // ✅ Gọi API lấy stores của user hiện tại
      const result = await getStoresByOwnerId(user.id, {
        page: 0,
        size: 50,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      
      if (result.success) {
        const data = result.data;
        const storeList = Array.isArray(data) ? data : data.content || [];
        setUserStores(storeList);
        
        // Load selected store from localStorage
        const savedStoreId = localStorage.getItem('selectedStoreId');
        let selectedStore = null;
        
        if (savedStoreId) {
          selectedStore = storeList.find(store => store.id === savedStoreId);
        }
        
        // If no saved store or saved store not found, use first approved store
        if (!selectedStore) {
          selectedStore = storeList.find(store => store.status === 'APPROVED');
        }
        
        if (selectedStore) {
          setCurrentStore(selectedStore);
        }
      } else {
        console.error('Failed to fetch user stores:', result.error);
        setUserStores([]);
      }
    } catch (error) {
      console.error('Error fetching user stores:', error);
      setUserStores([]);
    } finally {
      setLoading(false);
    }
  };

  const createStore = async (storeData) => {
    try {
      // TODO: Call API POST /b2c/stores/create
      // const response = await fetch('/api/b2c/stores/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(storeData)
      // });
      // const newStore = await response.json();
      
      // Mock creation
      const newStore = {
        id: `store-${Date.now()}`,
        ...storeData,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        stats: {
          products: 0,
          orders: 0,
          revenue: 0,
          rating: 0
        }
      };
      
      setUserStores(prev => [...prev, newStore]);
      return newStore;
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  };

  const updateStore = async (storeId, storeData) => {
    try {
      // TODO: Call API PUT /b2c/stores/{id}
      // const response = await fetch(`/api/b2c/stores/${storeId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(storeData)
      // });
      // const updatedStore = await response.json();
      
      // Mock update
      const updatedStore = { ...storeData, id: storeId };
      setUserStores(prev => 
        prev.map(store => store.id === storeId ? updatedStore : store)
      );
      
      // Update current store if it's the one being updated
      if (currentStore && currentStore.id === storeId) {
        setCurrentStore(updatedStore);
      }
      
      return updatedStore;
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  };

  const selectStore = (storeId) => {
    const store = userStores.find(s => s.id === storeId);
    if (store) {
      setCurrentStore(store);
      // TODO: Save selected store to localStorage or API
      localStorage.setItem('selectedStoreId', storeId);
    }
  };

  const uploadStoreLogo = async (storeId, logoFile) => {
    try {
      // TODO: Call API POST /b2c/stores/{id}/logo
      // const formData = new FormData();
      // formData.append('logo', logoFile);
      // const response = await fetch(`/api/b2c/stores/${storeId}/logo`, {
      //   method: 'POST',
      //   body: formData
      // });
      // const result = await response.json();
      
      // Mock upload
      const logoUrl = URL.createObjectURL(logoFile);
      const updatedStore = { ...currentStore, logoUrl };
      
      setUserStores(prev => 
        prev.map(store => store.id === storeId ? updatedStore : store)
      );
      
      if (currentStore && currentStore.id === storeId) {
        setCurrentStore(updatedStore);
      }
      
      return logoUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  };

  const uploadStoreBanner = async (storeId, bannerFile) => {
    try {
      // TODO: Call API POST /b2c/stores/{id}/banner
      // const formData = new FormData();
      // formData.append('banner', bannerFile);
      // const response = await fetch(`/api/b2c/stores/${storeId}/banner`, {
      //   method: 'POST',
      //   body: formData
      // });
      // const result = await response.json();
      
      // Mock upload
      const bannerUrl = URL.createObjectURL(bannerFile);
      const updatedStore = { ...currentStore, bannerUrl };
      
      setUserStores(prev => 
        prev.map(store => store.id === storeId ? updatedStore : store)
      );
      
      if (currentStore && currentStore.id === storeId) {
        setCurrentStore(updatedStore);
      }
      
      return bannerUrl;
    } catch (error) {
      console.error('Error uploading banner:', error);
      throw error;
    }
  };

  const refreshStoreStats = async (storeId) => {
    try {
      // TODO: Call API to get updated stats
      // const response = await fetch(`/api/b2c/analytics/dashboard/${storeId}`);
      // const stats = await response.json();
      
      // Mock refresh
      const updatedStats = {
        products: Math.floor(Math.random() * 100),
        orders: Math.floor(Math.random() * 200),
        revenue: Math.floor(Math.random() * 5000000000),
        rating: 4.5 + Math.random() * 0.5
      };
      
      setUserStores(prev => 
        prev.map(store => 
          store.id === storeId 
            ? { ...store, stats: updatedStats }
            : store
        )
      );
      
      if (currentStore && currentStore.id === storeId) {
        setCurrentStore(prev => ({ ...prev, stats: updatedStats }));
      }
      
      return updatedStats;
    } catch (error) {
      console.error('Error refreshing store stats:', error);
      throw error;
    }
  };

  const value = {
    userStores,
    currentStore,
    loading,
    setCurrentStore,
    selectStore,
    createStore,
    updateStore,
    uploadStoreLogo,
    uploadStoreBanner,
    refreshStoreStats,
    fetchUserStores
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContext;
