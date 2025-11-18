import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ProductSection from '../../components/common/ProductSection';
import { useEffect, useState } from 'react';
import { productService } from '../../services/common/productService';

const ShopPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Mock: derive some products from featured as placeholder
    const load = async () => {
      const res = await productService.getFeaturedProducts();
      if (res.success) setProducts(res.data.slice(0, 8));
      setShop({ id, name: id?.replace('_', ' ') || 'Shop', logoUrl: '' });
    };
    load();
  }, [id]);

  const handleProductClick = (p) => navigate(`/product/${p.id}`);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
          <h1 className="text-2xl font-bold">{shop?.name || 'Shop'}</h1>
        </div>
        <ProductSection title="Sản phẩm của shop" products={products} onProductClick={handleProductClick} backgroundColor="bg-white" showViewAll={false} />
      </div>
    </MainLayout>
  );
};

export default ShopPage;



