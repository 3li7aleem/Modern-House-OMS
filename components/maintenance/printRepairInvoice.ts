import { RepairInvoice, Customer } from '../../types';

export const printRepairInvoice = (
    repair: RepairInvoice, 
    customer?: Customer,
    isAr: boolean = true,
    formatCurrency: (val: number) => string = (val) => `${val.toFixed(3)} BHD`
) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    if (window.omsDesktop) printWindow.onload = () => printWindow.print();

    const remainingBalance = Math.max(0, repair.totalAmount - (repair.paidAmount || 0));

    const statusTranslations: Record<string, string> = {
        'Pending': 'قيد الانتظار والاستلام (Pending)',
        'In Progress': 'قيد الفحص والإصلاح (In Progress)',
        'Ready': 'جاهز للاستلام (Ready)',
        'Delivered': 'تم التسليم بنجاح (Delivered)',
        'Cancelled': 'ملغي (Cancelled)'
    };

    const priorityTranslations: Record<string, string> = {
        'Normal': 'عادي (Normal)',
        'High': 'مرتفع (High)',
        'Urgent': 'عاجل جداً (Urgent)'
    };

    const warrantyTranslations: Record<string, string> = {
        'Under Warranty': 'تحت الضمان (Under Warranty)',
        'Out of Warranty': 'خارج الضمان (Out of Warranty)'
    };

    const html = `
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
        <head>
          <meta charset="utf-8">
          <title>${isAr ? 'إيصال صيانة' : 'Repair Invoice'} - ${repair.repairNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
            * { box-sizing: border-box; }
            body { 
              font-family: 'Tajawal', sans-serif, system-ui; 
              padding: 30px; 
              color: #1e293b; 
              background: #fff;
              line-height: 1.5;
              font-size: 13px;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
              border: 1px solid #e2e8f0;
              padding: 30px;
              border-radius: 12px;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 2px solid #0f766e; 
              padding-bottom: 16px; 
              margin-bottom: 24px; 
            }
            .logo-title { 
              font-size: 22px; 
              font-weight: 900; 
              color: #0f766e; 
              letter-spacing: -0.5px;
            }
            .sub-title {
              font-size: 12px;
              color: #64748b;
              margin-top: 2px;
            }
            .invoice-badge { 
              text-align: ${isAr ? 'left' : 'right'}; 
            }
            .badge-num {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              font-family: monospace;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-panel {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 14px;
              border-radius: 8px;
            }
            .info-title {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              color: #0f766e;
              margin-bottom: 8px;
              border-bottom: 1px dashed #cbd5e1;
              padding-bottom: 4px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            .label { color: #64748b; font-size: 12px; }
            .val { font-weight: 700; color: #1e293b; font-size: 12px; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px; 
              margin-bottom: 20px;
            }
            th { 
              text-align: ${isAr ? 'right' : 'left'}; 
              background: #f1f5f9; 
              padding: 10px 12px; 
              border-bottom: 1px solid #cbd5e1; 
              font-size: 12px; 
              font-weight: 700;
              color: #334155;
            }
            td { 
              padding: 10px 12px; 
              border-bottom: 1px solid #f1f5f9; 
              font-size: 12px; 
            }
            .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 10px;
            }
            .totals-table {
              width: 280px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              font-size: 12px;
            }
            .totals-row.grand {
              border-top: 2px solid #0f766e;
              border-bottom: 2px solid #0f766e;
              font-weight: 800;
              font-size: 15px;
              color: #0f766e;
              margin-top: 4px;
              padding: 8px 0;
            }
            .terms {
              margin-top: 25px;
              padding: 12px;
              background: #fffbeb;
              border: 1px solid #fef3c7;
              border-radius: 8px;
              font-size: 11px;
              color: #92400e;
              line-height: 1.6;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px dashed #cbd5e1;
            }
            .sig-block {
              text-align: center;
              width: 200px;
            }
            .sig-line {
              border-bottom: 1px solid #94a3b8;
              height: 40px;
              margin-bottom: 6px;
            }
            @media print {
              body { padding: 0; }
              .invoice-box { border: none; padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <!-- Header -->
            <div class="header">
              <div>
                <div class="logo-title">${isAr ? 'مودرن هاوس للتجارة' : 'MODERN HOUSE FOR TRADING'}</div>
                <div class="sub-title">${isAr ? 'قسم الصيانة، الفحص وخدمات ما بعد البيع' : 'Maintenance & Customer Repair Services'}</div>
                <div class="sub-title">${isAr ? 'مملكة البحرين - هاتف: +973 39000000' : 'Kingdom of Bahrain - Tel: +973 39000000'}</div>
              </div>
              <div class="invoice-badge">
                <div style="font-size: 11px; font-weight: 800; color: #0f766e; text-transform: uppercase;">
                  ${isAr ? 'سند استلام وصيانة' : 'REPAIR INVOICE / RECEIPT'}
                </div>
                <div class="badge-num">${repair.repairNumber}</div>
                <div style="font-size: 11px; color: #64748b;">
                  ${isAr ? 'تاريخ الاستلام:' : 'Date:'} ${new Date(repair.date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <!-- Customer & Device Grid -->
            <div class="grid-2">
              <!-- Customer Info -->
              <div class="info-panel">
                <div class="info-title">${isAr ? 'بيانات العميل' : 'Customer Information'}</div>
                <div class="info-row">
                  <span class="label">${isAr ? 'الاسم:' : 'Name:'}</span>
                  <span class="val">${customer?.name || (isAr ? 'غير مسجل' : 'N/A')}</span>
                </div>
                <div class="info-row">
                  <span class="label">${isAr ? 'الهاتف:' : 'Phone:'}</span>
                  <span class="val" dir="ltr">${customer?.phone || (isAr ? 'غير مسجل' : 'N/A')}</span>
                </div>
                <div class="info-row">
                  <span class="label">${isAr ? 'العنوان:' : 'Address:'}</span>
                  <span class="val">${customer?.address || (isAr ? 'المنامة' : 'Manama')}</span>
                </div>
              </div>

              <!-- Device Info -->
              <div class="info-panel">
                <div class="info-title">${isAr ? 'بيانات الجهاز المسلم' : 'Device Specifications'}</div>
                <div class="info-row">
                  <span class="label">${isAr ? 'نوع الجهاز:' : 'Device Type:'}</span>
                  <span class="val">${repair.deviceType || (isAr ? 'أدوات مطبخ / جهاز منزلي' : 'Kitchen Appliance')}</span>
                </div>
                <div class="info-row">
                  <span class="label">${isAr ? 'الماركة والموديل:' : 'Brand/Model:'}</span>
                  <span class="val">${repair.brandModel || '-'}</span>
                </div>
                <div class="info-row">
                  <span class="label">${isAr ? 'الرقم التسلسلي:' : 'Serial #:'}</span>
                  <span class="val" dir="ltr">${repair.serialNumber || '-'}</span>
                </div>
                <div class="info-row">
                  <span class="label">${isAr ? 'الضمان:' : 'Warranty:'}</span>
                  <span class="val">${warrantyTranslations[repair.warrantyStatus || 'Out of Warranty']}</span>
                </div>
              </div>
            </div>

            <!-- Diagnosis & Symptoms -->
            <div class="info-panel" style="margin-bottom: 20px;">
              <div class="info-title">${isAr ? 'العطل المشخص / وصف المشكلة من العميل' : 'Reported Problem & Symptoms'}</div>
              <div style="font-size: 12px; color: #1e293b; line-height: 1.6;">
                ${repair.problemDescription || (isAr ? 'فحص شامل وإصلاح عطل تشغيل' : 'General inspection and servicing')}
              </div>
              ${repair.notes ? `
                <div style="margin-top: 8px; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
                  <b>${isAr ? 'ملاحظات الفني:' : 'Notes:'}</b> ${repair.notes}
                </div>
              ` : ''}
            </div>

            <!-- Items & Services Table -->
            <div style="font-weight: 800; font-size: 12px; color: #334155; margin-bottom: 4px;">
              ${isAr ? 'تفاصيل أعمال الصيانة وقطع الغيار' : 'Services & Replacement Parts'}
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th>${isAr ? 'البيان والخدمة' : 'Description'}</th>
                  <th style="width: 140px; text-align: ${isAr ? 'left' : 'right'};">${isAr ? 'المبلغ' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                ${repair.items.map((item, idx) => `
                  <tr>
                    <td style="text-align: center; color: #94a3b8; font-weight: bold;">${idx + 1}</td>
                    <td style="font-weight: 500;">${item.description || (isAr ? 'خدمة فحص وصيانة' : 'Service')}</td>
                    <td style="text-align: ${isAr ? 'left' : 'right'}; font-family: monospace; font-weight: bold;">
                      ${formatCurrency(item.cost)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Financials Summary -->
            <div class="totals-container">
              <div class="totals-table">
                <div class="totals-row">
                  <span class="label">${isAr ? 'إجمالي تكلفة الصيانة:' : 'Total Cost:'}</span>
                  <span class="val font-mono">${formatCurrency(repair.totalAmount)}</span>
                </div>
                <div class="totals-row">
                  <span class="label">${isAr ? 'المدفوع مقدماً / مسدد:' : 'Paid Advance:'}</span>
                  <span class="val font-mono" style="color: #059669;">${formatCurrency(repair.paidAmount || 0)}</span>
                </div>
                <div class="totals-row grand">
                  <span>${isAr ? 'المتبقي عند الاستلام:' : 'Balance Due:'}</span>
                  <span class="font-mono">${formatCurrency(remainingBalance)}</span>
                </div>
              </div>
            </div>

            <!-- Terms -->
            <div class="terms">
              <b>${isAr ? 'شروط وأحكام الصيانة:' : 'Maintenance Terms & Conditions:'}</b><br/>
              ${isAr 
                ? '١. يرجى إبراز هذا السند أو رقمه عند استلام الجهاز من المعرض.<br/>' +
                  '٢. تضمن المؤسسة أعمال الصيانة وقطع الغيار المركبة لمدة ٣٠ يوماً من تاريخ التسليم.<br/>' +
                  '٣. لا تتحمل المؤسسة مسؤولية الأجهزة المتروكة لأكثر من ٦٠ يوماً من تاريخ إشعار الجاهزية.'
                : '1. Please present this receipt upon device collection.<br/>' +
                  '2. Maintenance work and replaced parts are covered by a 30-day warranty from pickup date.<br/>' +
                  '3. The company is not liable for items uncollected for more than 60 days following ready notification.'
              }
            </div>

            <!-- Signatures -->
            <div class="signatures">
              <div class="sig-block">
                <div class="sig-line"></div>
                <div style="font-size: 11px; font-weight: 700; color: #475569;">
                  ${isAr ? 'توقيع الفني المستلم' : 'Technician Signature'}
                </div>
              </div>
              <div class="sig-block">
                <div class="sig-line"></div>
                <div style="font-size: 11px; font-weight: 700; color: #475569;">
                  ${isAr ? 'توقيع العميل' : 'Customer Signature'}
                </div>
              </div>
            </div>

          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 600);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};
