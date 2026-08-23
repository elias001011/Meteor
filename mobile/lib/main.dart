import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'app_controller.dart';
import 'data/local_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final preferences = await SharedPreferences.getInstance();
  final controller = AppController(store: LocalStore(preferences));
  await controller.notifications.initialize();
  runApp(MeteorApp(controller: controller));
  await controller.initialize();
}
