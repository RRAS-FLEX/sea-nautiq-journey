import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const resend = new Resend(process.env.RESEND_API_KEY);

const getNautiplexTemplate = (booking) => {
  const formattedDate = new Date(booking.start_date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Fallback values to prevent formatting errors
  const total = booking.total_price || 0;
  const paidNow = booking.amount_due_now || 0;
  const remaining = total - paidNow;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2D3748; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px; background-color: #ffffff;">
          
          <div style="text-align: center; border-bottom: 2px solid #3182CE; padding-bottom: 20px;">
             <img src="http://desk-jojos.tail9d3e44.ts.net:8080/nautiplex_logo.png" 
                  alt="NAUTIPLEX" 
                  style="height: 60px; width: auto;" />
          </div>

          <div style="background-color: #F7FAFC; padding: 30px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="margin:0; font-size: 24px; color: #2D3748;">Booking Confirmed!</h1>
            <p style="color: #718096; font-size: 16px;">Get ready to set sail, ${booking.customer_name}.</p>
          </div>

          <h2 style="font-size: 18px; color: #3182CE; border-bottom: 1px solid #EDF2F7; padding-bottom: 8px;">Trip Overview</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; font-weight: bold; color: #4A5568; width: 40%;">Boat</td><td style="padding: 12px 0;">${booking.boat_name}</td></tr>
            <tr><td style="padding: 12px 0; font-weight: bold; color: #4A5568;">Date</td><td style="padding: 12px 0;">${formattedDate}</td></tr>
            <tr><td style="padding: 12px 0; font-weight: bold; color: #4A5568;">Marina</td><td style="padding: 12px 0;">${booking.departure_marina}</td></tr>
          </table>

          <h2 style="font-size: 18px; color: #3182CE; border-bottom: 1px solid #EDF2F7; padding-bottom: 8px; margin-top: 30px;">Payment Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 0; font-weight: bold; color: #4A5568;">Total Price</td><td style="padding: 12px 0;">€${total.toFixed(2)}</td></tr>
            <tr><td style="padding: 12px 0; font-weight: bold; color: #4A5568;">Amount Paid Now</td><td style="padding: 12px 0; color: #38A169; font-weight: bold;">€${paidNow.toFixed(2)}</td></tr>
            <tr><td style="padding: 12px 0; font-weight: bold; color: #4A5568;">Remaining Balance</td><td style="padding: 12px 0;">€${remaining.toFixed(2)}</td></tr>
          </table>

          <div style="text-align: center; margin: 40px 0;">
            <a href="https://nautiplex.com/my-bookings" style="background-color: #3182CE; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Manage My Booking</a>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
            <div style="margin-bottom: 20px;">
              <a href="#" style="text-decoration: none; margin: 0 10px;">
                <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" width="20" height="20" alt="IG" style="opacity: 0.5;">
              </a>
              <a href="#" style="text-decoration: none; margin: 0 10px;">
                <img src="https://cdn-icons-png.flaticon.com/512/174/174848.png" width="20" height="20" alt="FB" style="opacity: 0.5;">
              </a>
            </div>

            <p style="font-size: 14px; font-weight: bold; color: #4A5568; margin: 0;">Nautiplex Boat Rentals</p>
            <p style="font-size: 12px; color: #A0AEC0; margin: 5px 0;">Athens, Greece &bull; Support: hello@nautiplex.com</p>
            
            <div style="margin: 20px 0; padding: 15px; background-color: #FFF5F5; border-radius: 6px; text-align: left;">
              <p style="font-size: 11px; color: #C53030; margin: 0; line-height: 1.4;">
                <strong>Cancellation Policy:</strong> Cancellations made 48 hours prior to departure are eligible for a full refund. Late cancellations or "no-shows" will be charged the full booking amount.
              </p>
            </div>

            <p style="font-size: 11px; color: #CBD5E0; margin-top: 20px;">
              You received this email because you made a booking on nautiplex.com.<br>
              &copy; 2026 Nautiplex. All rights reserved.
            </p>
          </div>

        </div>
      </body>
    </html>
  `;
};

async function sendTest() {
  const testEmail = process.env.RESEND_TEST_EMAIL;
  console.log(`🚀 Sending professional template to: ${testEmail}`);

  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [testEmail],
      subject: "⚓ Your Nautiplex Booking Confirmation",
      html: getNautiplexTemplate({
        customer_name: "George",
        boat_name: "Mediterranean Dream",
        start_date: "2026-06-20",
        departure_marina: "Athens Marina, Pier 4",
        total_price: 450.00,
        amount_due_now: 100.00
      }),
    });

    if (error) return console.error("❌ Error:", error);
    console.log("✅ Success! ID:", data.id);
  } catch (err) {
    console.error("❌ Critical Failure:", err);
  }
}

sendTest();