import { HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';

const HelpPage = () => {
  const { t } = useLanguage();

  const faqs = [
    { question: t.faqReportQ, answer: t.faqReportA },
    { question: t.faqVerifyQ, answer: t.faqVerifyA },
    { question: t.faqRouteQ, answer: t.faqRouteA },
    { question: t.faqIconsQ, answer: t.faqIconsA },
    { question: t.faqEmergencyQ, answer: t.faqEmergencyA },
    { question: t.faqLocationQ, answer: t.faqLocationA },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pb-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">{t.helpTitle}</h1>
            <p className="text-sm text-primary-foreground/80">{t.helpSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Video Tutorial Section */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-video bg-muted flex items-center justify-center relative">
              <video 
                className="w-full h-full object-cover"
                controls
                poster="/placeholder.svg"
              >
                <source src="/videos/user-guide.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </CardContent>
        </Card>

        {/* FAQs Section */}
        <div>
          <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            {t.faq}
          </h2>
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-b-0">
                    <AccordionTrigger className="px-4 py-3 text-left text-sm font-medium text-primary hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
