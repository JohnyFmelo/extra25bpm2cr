
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TCOFormProps {
  userId?: string;
  toast?: any;
}

const TCOForm: React.FC<TCOFormProps> = ({ userId, toast }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>New TCO Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This is a placeholder for the TCO Form component.</p>
          <p>User ID: {userId || 'No user ID available'}</p>
          <Button 
            onClick={() => toast({ 
              title: "Test Toast", 
              description: "The toast functionality is working!", 
              className: "bg-green-600 text-white" 
            })}
            className="mt-4"
          >
            Test Toast
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TCOForm;
