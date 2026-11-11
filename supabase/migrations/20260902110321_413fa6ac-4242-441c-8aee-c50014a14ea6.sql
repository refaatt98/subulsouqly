CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Authenticated can read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subtitle text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu items are public" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins manage menu items" ON public.menu_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery text NOT NULL DEFAULT 'main',
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT ALL ON public.gallery_images TO service_role;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gallery images are public" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "Admins manage gallery images" ON public.gallery_images FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER gallery_images_updated_at BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.gallery_validation_dummy (id int);
DROP TABLE public.gallery_validation_dummy;

INSERT INTO public.categories (id, name, subtitle, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'قهوتك', 'قائمة قصيرة، منتقاة. مرّر على أي صنف لتقرأ ملاحظة المذاق.', 1),
  ('22222222-2222-2222-2222-222222222222', 'من توقيعنا', NULL, 2);

INSERT INTO public.menu_items (category_id, name, description, price, image_url, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'إسبريسو', 'شوت مركّز، حلاوة كراميل وخاتمة كاكاو', 10, '/__l5e/assets-v1/7b21bbba-8aa9-457c-a364-c568df3d2766/pour.jpeg', 1),
  ('11111111-1111-1111-1111-111111111111', 'أمريكانو', 'إسبريسو ممدود بالماء، صافٍ وخفيف', 12, '/__l5e/assets-v1/4c7d160b-84c5-4cd2-b5d3-f474bf5cea41/cup-leaves.jpeg', 2),
  ('11111111-1111-1111-1111-111111111111', 'لاتيه', 'حليب مخملي بنسبة متوازنة مع القهوة', 14, '/__l5e/assets-v1/7a221d8b-2cc6-4398-b780-e4e8e24bb742/tray.jpeg', 3),
  ('11111111-1111-1111-1111-111111111111', 'كابتشينو', 'رغوة كثيفة ودافئة، النسخة الكلاسيكية', 14, '/__l5e/assets-v1/90dce320-a7ad-467f-be6d-7fa42f92bd11/three-cups.jpeg', 4),
  ('11111111-1111-1111-1111-111111111111', 'فلات وايت', 'حليب أقل، جسم أعمق، مذاق مركّز', 15, '/__l5e/assets-v1/daebc297-dc63-456f-8101-aef9fda6bc3b/hand-cup.jpeg', 5),
  ('11111111-1111-1111-1111-111111111111', 'موكا', 'شوكولاتة داكنة تلتقي بالإسبريسو', 16, '/__l5e/assets-v1/32360cbc-f61c-4620-88f0-c2548f2ea6ab/blur-cup.jpeg', 6),
  ('11111111-1111-1111-1111-111111111111', 'كولد برو', 'نقع بارد ١٨ ساعة، حموضة ناعمة', 16, '/__l5e/assets-v1/7b21bbba-8aa9-457c-a364-c568df3d2766/pour.jpeg', 7),
  ('22222222-2222-2222-2222-222222222222', 'سُبّل آيسد', 'لاتيه بارد بلمسة تمر وهيل — توقيع البيت', 18, '/__l5e/assets-v1/4d42adf5-eb95-4471-8a0e-1d515979a54f/palm-panel.jpeg', 1),
  ('22222222-2222-2222-2222-222222222222', 'واحة خضراء', 'ماتشا وفستق على حليب بارد', 19, '/__l5e/assets-v1/4c7d160b-84c5-4cd2-b5d3-f474bf5cea41/cup-leaves.jpeg', 2);

INSERT INTO public.gallery_images (gallery, image_url, caption, sort_order) VALUES
  ('main', '/__l5e/assets-v1/4c7d160b-84c5-4cd2-b5d3-f474bf5cea41/cup-leaves.jpeg', 'الكوب بين السعف', 1),
  ('main', '/__l5e/assets-v1/7b21bbba-8aa9-457c-a364-c568df3d2766/pour.jpeg', 'سكب بارد', 2),
  ('main', '/__l5e/assets-v1/7a221d8b-2cc6-4398-b780-e4e8e24bb742/tray.jpeg', 'لاتيه آرت', 3),
  ('main', '/__l5e/assets-v1/90dce320-a7ad-467f-be6d-7fa42f92bd11/three-cups.jpeg', 'ثلاثة أكواب', 4),
  ('main', '/__l5e/assets-v1/4d42adf5-eb95-4471-8a0e-1d515979a54f/palm-panel.jpeg', 'نخيل سُبّل', 5),
  ('space', '/__l5e/assets-v1/daebc297-dc63-456f-8101-aef9fda6bc3b/hand-cup.jpeg', 'المقهى', 1),
  ('space', '/__l5e/assets-v1/4d42adf5-eb95-4471-8a0e-1d515979a54f/palm-panel.jpeg', 'الكاونتر', 2),
  ('space', '/__l5e/assets-v1/7a221d8b-2cc6-4398-b780-e4e8e24bb742/tray.jpeg', 'زاوية الجلوس', 3),
  ('space', '/__l5e/assets-v1/90dce320-a7ad-467f-be6d-7fa42f92bd11/three-cups.jpeg', 'الطاولة', 4);