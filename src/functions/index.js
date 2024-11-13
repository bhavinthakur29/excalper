const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "YOUR_EMAIL@gmail.com",
    pass: "YOUR_EMAIL_PASSWORD",
  },
});

exports.sendMonthlyExpenseEmail = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    const usersRef = admin.firestore().collection("users");
    const snapshot = await usersRef.get();

    snapshot.forEach(async (doc) => {
      const userData = doc.data();
      const userId = doc.id;
      const notificationDate = userData.notificationDate;
      const today = new Date().toISOString().slice(0, 10);

      if (notificationDate === today) {
        const expensesRef = admin
          .firestore()
          .collection("expenses")
          .where("userId", "==", userId);
        const expensesSnapshot = await expensesRef.get();

        let totalAmount = 0;
        expensesSnapshot.forEach((expenseDoc) => {
          totalAmount += expenseDoc.data().amount;
        });

        const mailOptions = {
          from: "bhaavint@gmail.com",
          to: userData.email,
          subject: "Monthly Expense Report",
          text: `Your total expenses for this month are $${totalAmount}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("Error sending email:", error);
          } else {
            console.log("Email sent:", info.response);
          }
        });
      }
    });

    return null;
  });
