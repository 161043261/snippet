export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification')
    return
  }
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

export const sendNotification = (title: string, body?: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.svg'
    })
  }
}
