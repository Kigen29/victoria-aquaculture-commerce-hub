-- Create page_content table for dynamic pages
CREATE TABLE public.page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT,
  content TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Public can view published pages
CREATE POLICY "Anyone can view published pages"
ON public.page_content
FOR SELECT
USING (published = true);

-- Admins can manage all pages
CREATE POLICY "Admin can manage pages"
ON public.page_content
FOR ALL
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE has_role(id, 'admin')
));

-- Add trigger for updated_at
CREATE TRIGGER update_page_content_updated_at
BEFORE UPDATE ON public.page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial content for footer pages
INSERT INTO public.page_content (slug, title, meta_description, content) VALUES
(
  'faq',
  'Frequently Asked Questions',
  'Find answers to common questions about Lake Victoria Aquaculture products, orders, shipping, and more.',
  '<h1>Frequently Asked Questions</h1>
  
  <section>
    <h2>Product Questions</h2>
    <h3>What types of fish do you offer?</h3>
    <p>We specialize in fresh tilapia, catfish, and other Lake Victoria fish species. All our fish are sustainably farmed using modern aquaculture techniques.</p>
    
    <h3>Are your fish fresh?</h3>
    <p>Yes! We harvest and deliver our fish fresh daily. Our cold chain ensures maximum freshness from farm to your table.</p>
    
    <h3>Do you offer cleaned and filleted fish?</h3>
    <p>We offer whole fish, cleaned fish, and filleted options. You can specify your preference when placing an order.</p>
  </section>
  
  <section>
    <h2>Order & Delivery</h2>
    <h3>What areas do you deliver to?</h3>
    <p>We currently deliver to Nairobi, Kisumu, and surrounding areas. Contact us to check if we deliver to your location.</p>
    
    <h3>How long does delivery take?</h3>
    <p>Standard delivery takes 1-2 business days within Nairobi and Kisumu. Same-day delivery is available for orders placed before 10 AM.</p>
    
    <h3>What is your minimum order quantity?</h3>
    <p>Our minimum order is 2kg for individual customers. Bulk orders for restaurants and institutions have different requirements.</p>
  </section>
  
  <section>
    <h2>Payment & Pricing</h2>
    <h3>What payment methods do you accept?</h3>
    <p>We accept M-Pesa, bank transfers, and cash on delivery for certain locations.</p>
    
    <h3>Do your prices include delivery?</h3>
    <p>Delivery charges are calculated separately based on your location and order size.</p>
  </section>'
),
(
  'shipping',
  'Shipping Policy',
  'Learn about our delivery areas, shipping costs, and delivery timeframes for Lake Victoria Aquaculture products.',
  '<h1>Shipping Policy</h1>
  
  <section>
    <h2>Delivery Areas</h2>
    <p>Lake Victoria Aquaculture delivers to the following areas:</p>
    <ul>
      <li><strong>Nairobi:</strong> All areas within Nairobi County</li>
      <li><strong>Kisumu:</strong> Kisumu City and surrounding areas within 20km radius</li>
      <li><strong>Nakuru:</strong> Nakuru Town and nearby locations</li>
      <li><strong>Custom Locations:</strong> Contact us for delivery to other areas</li>
    </ul>
  </section>
  
  <section>
    <h2>Delivery Timeframes</h2>
    <ul>
      <li><strong>Same Day Delivery:</strong> Orders placed before 10:00 AM (Nairobi & Kisumu only)</li>
      <li><strong>Next Day Delivery:</strong> Orders placed before 6:00 PM</li>
      <li><strong>Standard Delivery:</strong> 1-2 business days</li>
      <li><strong>Remote Areas:</strong> 2-3 business days</li>
    </ul>
  </section>
  
  <section>
    <h2>Shipping Costs</h2>
    <table>
      <tr><th>Location</th><th>Standard Delivery</th><th>Same Day Delivery</th></tr>
      <tr><td>Nairobi (CBD)</td><td>KSh 200</td><td>KSh 400</td></tr>
      <tr><td>Nairobi (Suburbs)</td><td>KSh 300</td><td>KSh 500</td></tr>
      <tr><td>Kisumu</td><td>KSh 250</td><td>KSh 450</td></tr>
      <tr><td>Other Areas</td><td>Contact Us</td><td>Not Available</td></tr>
    </table>
    <p><em>Free delivery on orders above KSh 5,000 within Nairobi and Kisumu.</em></p>
  </section>
  
  <section>
    <h2>Packaging & Handling</h2>
    <p>All fish products are:</p>
    <ul>
      <li>Packed in insulated containers with ice packs</li>
      <li>Sealed to maintain freshness and prevent contamination</li>
      <li>Labeled with product details and handling instructions</li>
      <li>Delivered in refrigerated vehicles when possible</li>
    </ul>
  </section>'
),
(
  'returns',
  'Returns & Refunds Policy',
  'Our return and refund policy for Lake Victoria Aquaculture products, including quality guarantees and refund procedures.',
  '<h1>Returns & Refunds Policy</h1>
  
  <section>
    <h2>Quality Guarantee</h2>
    <p>We stand behind the quality of our fish products. If you are not satisfied with your order, we offer returns and refunds under the following conditions:</p>
  </section>
  
  <section>
    <h2>Return Eligibility</h2>
    <p>Returns are accepted for:</p>
    <ul>
      <li>Fish that arrives spoiled or not fresh</li>
      <li>Incorrect orders (wrong species or quantity)</li>
      <li>Damaged products due to poor packaging</li>
      <li>Products that do not meet our quality standards</li>
    </ul>
    
    <p><strong>Returns must be reported within 2 hours of delivery.</strong></p>
  </section>
  
  <section>
    <h2>Return Process</h2>
    <ol>
      <li><strong>Contact Us Immediately:</strong> Call +254 782 991 996 or email info@lakevictoriaaquaculture.com</li>
      <li><strong>Provide Details:</strong> Order number, issue description, and photos if possible</li>
      <li><strong>Keep Products Refrigerated:</strong> Maintain cold chain until we collect or advise disposal</li>
      <li><strong>Await Instructions:</strong> We will arrange collection or provide return instructions</li>
    </ol>
  </section>
  
  <section>
    <h2>Refund Policy</h2>
    <ul>
      <li><strong>Full Refund:</strong> For spoiled, incorrect, or damaged products</li>
      <li><strong>Store Credit:</strong> Available for future purchases</li>
      <li><strong>Replacement:</strong> Free replacement for eligible returns</li>
      <li><strong>Processing Time:</strong> Refunds processed within 3-5 business days</li>
    </ul>
  </section>
  
  <section>
    <h2>Non-Returnable Items</h2>
    <p>The following items cannot be returned:</p>
    <ul>
      <li>Products kept beyond 2 hours without refrigeration</li>
      <li>Fish that has been cleaned by customer</li>
      <li>Products ordered for specific events after the event date</li>
      <li>Custom processed orders (filleting, special cuts) unless defective</li>
    </ul>
  </section>
  
  <section>
    <h2>Contact Information</h2>
    <p>For returns and refunds:</p>
    <ul>
      <li><strong>Phone:</strong> +254 782 991 996 (Available 6 AM - 8 PM)</li>
      <li><strong>Email:</strong> info@lakevictoriaaquaculture.com</li>
      <li><strong>Response Time:</strong> Within 1 hour during business hours</li>
    </ul>
  </section>'
),
(
  'terms',
  'Terms & Conditions',
  'Terms and conditions for using Lake Victoria Aquaculture services, including user responsibilities and legal agreements.',
  '<h1>Terms & Conditions</h1>
  
  <section>
    <h2>Agreement to Terms</h2>
    <p>By accessing and using Lake Victoria Aquaculture services, you agree to be bound by these Terms and Conditions. If you do not agree with any of these terms, you may not use our services.</p>
  </section>
  
  <section>
    <h2>Product Information</h2>
    <ul>
      <li>All fish products are farm-raised using sustainable aquaculture practices</li>
      <li>Product availability may vary based on seasonal factors</li>
      <li>Weights are approximate and may vary by ±5%</li>
      <li>Product images are for illustration purposes</li>
    </ul>
  </section>
  
  <section>
    <h2>Ordering & Payment</h2>
    <ul>
      <li>Orders are subject to availability and confirmation</li>
      <li>Prices are in Kenyan Shillings (KSh) and include applicable taxes</li>
      <li>Payment must be completed before delivery</li>
      <li>We reserve the right to cancel orders for any reason</li>
    </ul>
  </section>
  
  <section>
    <h2>Delivery Terms</h2>
    <ul>
      <li>Delivery times are estimates and not guaranteed</li>
      <li>Customer must be available to receive products</li>
      <li>Failed delivery attempts may result in additional charges</li>
      <li>Risk of loss transfers to customer upon delivery</li>
    </ul>
  </section>
  
  <section>
    <h2>Food Safety</h2>
    <ul>
      <li>Customers are responsible for proper storage and handling after delivery</li>
      <li>Products should be refrigerated immediately upon receipt</li>
      <li>We are not liable for issues arising from improper storage</li>
      <li>Pregnant women and immunocompromised individuals should consult doctors</li>
    </ul>
  </section>
  
  <section>
    <h2>Privacy Policy</h2>
    <p>We collect and use personal information solely for order processing and delivery. We do not share customer information with third parties except as required for delivery services.</p>
  </section>
  
  <section>
    <h2>Liability Limitation</h2>
    <p>Lake Victoria Aquaculture'\''s liability is limited to the purchase price of the products. We are not liable for consequential or incidental damages.</p>
  </section>
  
  <section>
    <h2>Governing Law</h2>
    <p>These terms are governed by the laws of Kenya. Any disputes will be resolved in Kenyan courts.</p>
  </section>
  
  <section>
    <h2>Contact Information</h2>
    <p>For questions about these terms:</p>
    <ul>
      <li><strong>Email:</strong> info@lakevictoriaaquaculture.com</li>
      <li><strong>Phone:</strong> +254 782 991 996</li>
      <li><strong>Address:</strong> Lake Victoria Aquaculture, Kenya</li>
    </ul>
  </section>
  
  <p><em>Last updated: {current_date}</em></p>'
);