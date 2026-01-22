import { HelpCircle, ChevronDown } from 'lucide-react';
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
    {
      question: 'How do I report a hazard?',
      answer: 'Go to the Map page and tap the "Report Hazard" button. You can take a photo, select the hazard type, and provide a description. Your report will be reviewed by administrators before being published.',
    },
    {
      question: 'How do I get verified?',
      answer: 'Complete your profile with your full name, phone number, and barangay information. An administrator will review and verify your account. Verified users have access to additional features and their reports are prioritized.',
    },
    {
      question: 'How do I find a safe route?',
      answer: 'Go to the Map page and use the "Find Route" feature. Select your starting point and destination (evacuation center), and the app will generate a safe route avoiding known hazards.',
    },
    {
      question: 'What do the map icons mean?',
      answer: 'Red markers indicate active hazards (floods, landslides, fires). Green markers show evacuation centers. Blue markers represent your current location. Yellow markers are pending hazard reports.',
    },
    {
      question: 'How do I call emergency services?',
      answer: 'Go to the Hotlines page accessible from the bottom navigation. Tap on any number to directly call that emergency service. For life-threatening emergencies, always call 911 first.',
    },
    {
      question: "Why isn't my location working?",
      answer: 'Make sure you have enabled location services for this app in your device settings. Go to Profile > Location Services and ensure it is turned on. If problems persist, try restarting the app.',
    },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pb-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">Help</h1>
            <p className="text-sm text-primary-foreground/80">Get assistance and learn more</p>
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
            Frequently Asked Questions
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
