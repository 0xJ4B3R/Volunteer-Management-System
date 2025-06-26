import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Users, Calendar } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';

// Register the Rubik font
Font.register({
  family: 'Rubik',
  src: '/fonts/Rubik-Regular.ttf.ttf'
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Rubik'
  },
  header: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1f2937',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#6b7280'
  },
  section: {
    margin: 10,
    padding: 15,
    border: '1px solid #e5e7eb',
    borderRadius: 8
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
    color: '#374151',
    fontWeight: 'bold'
  },
  text: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 1.6,
    color: '#4b5563'
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 10
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
    padding: 8
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 8
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#374151'
  },
  tableCell: {
    fontSize: 11,
    textAlign: 'center',
    color: '#4b5563'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  statItem: {
    flex: 1,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    marginHorizontal: 5,
    borderRadius: 4
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2
  }
});

// Hebrew PDF Document Component
const HebrewPDFDocument = () => {
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text>דוח פעילות מתנדבים</Text>
        </View>
        <Text style={styles.subtitle}>Volunteer Activity Report</Text>
        
        {/* Statistics Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>מתנדבים פעילים</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>120</Text>
            <Text style={styles.statLabel}>שעות התנדבות</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>מפגשים שבועיים</Text>
          </View>
        </View>
        
        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.title}>סיכום שבועי</Text>
          <Text style={styles.text}>
            דוח זה מציג את הפעילות השבועית של המתנדבים במערכת הניהול. 
            הנתונים כוללים את כל הפעילויות שבוצעו בין התאריכים המצוינים.
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>תאריך יצירת הדוח:</Text> {currentDate}
          </Text>
        </View>
        
        {/* Volunteers Table */}
        <View style={styles.section}>
          <Text style={styles.title}>רשימת מתנדבים</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>שם המתנדב</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>שעות</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>מפגשים</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>סטטוס</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>שרה כהן</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>12</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>8</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>פעיל</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>דוד לוי</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>8</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>5</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>פעיל</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>רחל גולדברג</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>15</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>10</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>פעיל</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.title}>הערות חשובות</Text>
          <Text style={styles.text}>• כל המתנדבים עברו הכשרה מתאימה</Text>
          <Text style={styles.text}>• הפעילות מתבצעת בהתאם לפרוטוקולים הבטיחותיים</Text>
          <Text style={styles.text}>• דוחות שבועיים נשלחים למנהל המערכת</Text>
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>
          נוצר ב-{currentDate} | מערכת ניהול מתנדבים | כל הזכויות שמורות
        </Text>
      </Page>
    </Document>
  );
};

// Main Test Component
const HebrewPDFTest: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <FileText className="h-5 w-5" />
            Hebrew PDF Test with Rubik Font
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Test Hebrew PDF generation using react-pdf with Rubik font
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Hebrew Text Support
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                RTL Layout
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-dashed">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Features Tested:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Hebrew text rendering</li>
                  <li>• Rubik font integration</li>
                  <li>• RTL text direction</li>
                  <li>• Tables with Hebrew headers</li>
                  <li>• Hebrew date formatting</li>
                  <li>• Multiple text styles</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-dashed">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">PDF Content:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Volunteer activity report</li>
                  <li>• Statistics summary</li>
                  <li>• Volunteer list table</li>
                  <li>• Hebrew notes section</li>
                  <li>• Professional footer</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center">
            <PDFDownloadLink
              document={<HebrewPDFDocument />}
              fileName="hebrew-volunteer-report.pdf"
              className="w-full max-w-xs"
            >
              {({ blob, url, loading, error }) => (
                <Button 
                  className="w-full" 
                  disabled={loading}
                  onClick={() => setIsGenerating(loading)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {loading ? 'Generating PDF...' : 'Download Hebrew PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded border">
              <strong>Development Info:</strong>
              <div className="mt-1 space-y-1">
                <div>Font file: <code>/fonts/Rubik-Regular.ttf.ttf</code></div>
                <div>Library: <code>@react-pdf/renderer</code></div>
                <div>RTL Support: Native Hebrew text direction</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HebrewPDFTest; 