package md.mdobs.andyPush;

import org.json.JSONException;
import org.json.JSONObject;
import org.usergrid.cordova.PushNotification;

import android.app.AlertDialog;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.util.Log;

import com.google.android.gcm.GCMBaseIntentService;

public class GCMIntentService extends GCMBaseIntentService {

	@Override
	protected void onError(Context arg0, String error) {
		// TODO Auto-generated method stub
		Log.i("PUSH.ERROR", error);

	}

	@Override
	protected void onMessage(Context context, Intent notification) {
		JSONObject notificationMessage = new JSONObject();
		try {
			String message = notification.getExtras().getString("data");
			notificationMessage.put("message", message);
			PushNotification.sendPush(notificationMessage);
			generateNotification(context, message);
		} catch (JSONException e) {
			e.printStackTrace();
		}
		
	}

	@Override
	protected void onRegistered(Context c, String registrationId) {
		JSONObject registrationMessage = new JSONObject();
		Log.i("Push.intentService", registrationId);
		try {
			registrationMessage.put("deviceId", registrationId);
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		PushNotification.sendRegistration(registrationMessage);

	}

	@Override
	protected void onUnregistered(Context arg0, String arg1) {
		// TODO Auto-generated method stub

	}

  /**
   * Issues a Notification to inform the user that server has sent a message.
   */
  private static void generateNotification(Context context, String message) {
    int icon = R.drawable.ic_launcher;
    long when = System.currentTimeMillis();
    NotificationManager notificationManager = (NotificationManager)
        context.getSystemService(Context.NOTIFICATION_SERVICE);
    Notification notification = new Notification(icon, message, when);

    String title = context.getString(R.string.app_name);

    Intent notificationIntent = new Intent(context, andyPush.class);
    // set intent so it does not start a new activity
    notificationIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent intent = PendingIntent.getActivity(context, 0, notificationIntent, 0);
    notification.setLatestEventInfo(context, title, message, intent);
    notification.flags |= Notification.FLAG_AUTO_CANCEL;

    // Play default notification sound
    notification.defaults |= Notification.DEFAULT_SOUND;

    // Vibrate if vibrate is enabled
    notification.defaults |= Notification.DEFAULT_VIBRATE;
    notificationManager.notify(0, notification);
  }
  
}
