import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { PromoSignupForm } from "../contact/PromoSignupForm";

const ContactSection = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form handling logic will go here
  };

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold mb-2 text-aqua-800">Get In Touch</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions or need assistance? We're here to help!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="glass-card p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input id="name" type="text" placeholder="Your Name" required />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="Your Email" required />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <Input id="subject" placeholder="Message Subject" required />
              </div>
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <Textarea id="message" placeholder="Your Message" rows={5} required />
              </div>
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          </div>

          <div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-aqua-800">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Mail className="h-5 w-5 text-lake-600" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Email Us</p>
                    <p className="text-gray-600">info@lakevictoriaaquaculture.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Phone className="h-5 w-5 text-lake-600" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Call Us</p>
                    <p className="text-gray-600">+254 782 991 996</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <MapPin className="h-5 w-5 text-lake-600" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Location</p>
                    <p className="text-gray-600">Lake Victoria Aquaculture Limited</p>
                    <p className="text-gray-600">Nairobi, Kenya</p>
                    <p className="text-gray-600">Kogo Star Plaza, Ground floor, Nairobi West-off maimahiu Rd</p>
                  </div>
                </div>

                <div className="mt-6">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.7695010082234!2d36.81391957477732!3d-1.3137747986737491!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1057226f4869%3A0x3f7350ca6459738a!2sKogo%20Star%20Plaza%2C%20Nairobi!5e0!3m2!1sen!2ske!4v1714052242022!5m2!1sen!2ske"
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                  ></iframe>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-aqua-800">Business Hours</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday:</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday:</span>
                  <span className="font-medium">9:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday:</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-aqua-800">Stay Connected</h3>
              <PromoSignupForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
